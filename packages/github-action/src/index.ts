import fs from "node:fs";
import path from "node:path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { scanCompose } from "@deploysense/compose-scanner";
import { scanDockerfile } from "@deploysense/docker-scanner";
import { scanGithubActions } from "@deploysense/github-actions-scanner";
import { scanKubernetes } from "@deploysense/k8s-scanner";
import { createProjectReport } from "@deploysense/scanner-core";
import type { ScanResult, Severity } from "@deploysense/scanner-core";

const rank: Severity[] = ["critical", "high", "medium", "low", "info"];

async function run() {
  const scanPath = path.resolve(core.getInput("scan-path") || ".");
  const failOn = (core.getInput("fail-on") || "high") as Severity;
  const commentPr = core.getBooleanInput("comment-pr");
  const results = findFiles(scanPath).map((file) => scanFile(file));
  const report = createProjectReport(results, scanPath);
  core.setOutput("score", report.overallScore);
  core.setOutput("issues-count", report.totalIssues);
  core.setOutput("critical-count", report.topIssues.filter((issue) => issue.severity === "critical").length);
  core.setOutput("high-count", report.topIssues.filter((issue) => issue.severity === "high").length);
  core.summary.addRaw(toComment(report.scanResults)).write();
  if (commentPr && github.context.payload.pull_request) await postPrComment(toComment(report.scanResults));
  const threshold = rank.indexOf(failOn);
  if (results.some((result) => result.issues.some((issue) => rank.indexOf(issue.severity) <= threshold))) {
    core.setFailed(`DeploySense found issues at or above ${failOn}`);
  }
}

function findFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (detect(full, fs.readFileSync(full, "utf8"))) files.push(full);
    }
  };
  if (fs.statSync(root).isDirectory()) visit(root);
  else files.push(root);
  return files;
}

function detect(file: string, content: string) {
  const name = file.replace(/\\/g, "/").toLowerCase();
  return name.endsWith("dockerfile") || name.includes(".github/workflows/") || /docker-compose.*\.ya?ml$|compose\.ya?ml$/.test(name) || /\bkind:\s*(deployment|service|pod|statefulset|daemonset)\b/i.test(content);
}

function scanFile(file: string): ScanResult {
  const content = fs.readFileSync(file, "utf8");
  const name = file.replace(/\\/g, "/").toLowerCase();
  if (name.endsWith("dockerfile")) return scanDockerfile(content, file);
  if (name.includes(".github/workflows/")) return scanGithubActions(content, file);
  if (/docker-compose.*\.ya?ml$|compose\.ya?ml$/.test(name)) return scanCompose(content, file);
  return scanKubernetes(content, file);
}

async function postPrComment(body: string) {
  const token = core.getInput("github-token");
  const octokit = github.getOctokit(token);
  const pr = github.context.payload.pull_request;
  if (!pr) return;
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: pr.number,
    body
  });
}

function toComment(results: ScanResult[]) {
  const score = results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 100;
  const issues = results.flatMap((result) => result.issues.slice(0, 5).map((issue) => ({ result, issue })));
  return `## DeploySense Report

**Overall Score:** ${score}/100

| Scanner | Score | Issues |
|---|---:|---:|
${results.map((result) => `| ${result.tool} | ${result.score}/100 | ${result.summary.total} |`).join("\n")}

### Top Issues

| Severity | Rule | File | Fix |
|---|---|---|---|
${issues.map(({ result, issue }) => `| ${issue.severity} | ${issue.id} | ${result.file} | ${issue.fix.replace(/\|/g, "\\|")} |`).join("\n")}

---
DeploySense - open-source DevOps intelligence
`;
}

run().catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
