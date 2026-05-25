#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import boxen from "boxen";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import YAML from "yaml";
import { analyzeLog } from "@deploysense/log-doctor";
import { applyFixes, createProjectReport, projectToMarkdown, toJson, toMarkdown, toSarif, toTerminal } from "@deploysense/scanner-core";
import type { ProjectReport, ScanResult, Severity } from "@deploysense/scanner-core";
import { listComposeRules } from "@deploysense/compose-scanner";
import { listDockerRules } from "@deploysense/docker-scanner";
import { listGithubActionsRules } from "@deploysense/github-actions-scanner";
import { listK8sRules } from "@deploysense/k8s-scanner";
import { findScannableFiles, scanContent } from "./scanners";

const program = new Command();
const severities: Severity[] = ["critical", "high", "medium", "low", "info"];

interface Config {
  ignore?: string[];
  failOn?: Severity;
  output?: string;
  rules?: { disable?: string[] };
}

program
  .name("deploysense")
  .description("Open-source DevOps intelligence for deployment configs and logs.")
  .version("0.1.0");

program
  .command("scan")
  .argument("<file-or-path>", "file or directory to scan")
  .option("--json", "output JSON")
  .option("--markdown", "output Markdown")
  .option("--sarif", "output SARIF")
  .option("--severity <level>", "only show issues at or above severity")
  .option("--fail-on <level>", "exit 1 if this severity or higher is found")
  .option("--scanner <type>", "force scanner: auto, dockerfile, github-actions, kubernetes, compose", "auto")
  .option("--no-color", "disable ANSI colors")
  .option("--quiet", "only show score and issue count")
  .option("--apply-fixes", "apply safe auto-fixes after scanning")
  .option("--yes", "apply fixes without confirmation")
  .action((target: string, options: Record<string, unknown>) => {
    const config = loadConfig(process.cwd());
    const full = path.resolve(target);
    const spinner = options.json || options.markdown || options.sarif || options.quiet ? undefined : ora("Scanning with DeploySense").start();
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const report = scanDirectory(full, config, options);
        spinner?.succeed(`Scanned ${report.scanResults.length} files`);
        outputProject(report, options);
        exitIfNeeded(report.scanResults, (options.failOn as Severity) ?? config.failOn);
        return;
      }
      const result = scanFile(full, options.scanner as string);
      spinner?.succeed("Scan complete");
      const filtered = filterResult(result, options.severity as Severity | undefined);
      outputResult(filtered, options);
      if (options.applyFixes) applyAndWriteFixes(full, result, Boolean(options.yes));
      exitIfNeeded([result], options.failOn as Severity | undefined);
    } catch (error) {
      spinner?.fail("Scan failed");
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    }
  });

program
  .command("fix")
  .argument("<file>", "file to fix")
  .option("--yes", "apply without confirmation")
  .option("--scanner <type>", "force scanner", "auto")
  .action((file: string, options: { yes?: boolean; scanner?: string }) => {
    const full = path.resolve(file);
    const result = scanFile(full, options.scanner);
    applyAndWriteFixes(full, result, Boolean(options.yes));
  });

program
  .command("doctor")
  .argument("<logfile>", "deployment log file")
  .option("--json", "output JSON")
  .action((logfile: string, options: { json?: boolean }) => {
    const content = fs.readFileSync(path.resolve(logfile), "utf8");
    const result = analyzeLog(content);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(chalk.cyan.bold("DeploySense Log Doctor"));
    console.log(result.summary);
    for (const finding of result.findings) {
      console.log(`\n${chalk.yellow(`[${finding.severity.toUpperCase()}]`)} ${chalk.bold(finding.title)} (${finding.lineNumber})`);
      console.log(`Line: ${finding.matchedLine}`);
      console.log(`Likely causes: ${finding.causes.join(", ")}`);
      console.log(`Try: ${finding.debugCommands.join(" | ")}`);
      console.log(`Fix: ${finding.fixSteps.join(" ")}`);
    }
  });

program.command("list-rules").option("--json", "output JSON").action((options: { json?: boolean }) => {
  const rules = allRules();
  if (options.json) {
    console.log(JSON.stringify(rules, null, 2));
    return;
  }
  console.log(chalk.bold("DeploySense Rules"));
  for (const rule of rules) {
    console.log(`${chalk.cyan(rule.id.padEnd(34))} ${rule.severity.padEnd(8)} ${rule.category.padEnd(16)} ${rule.title}`);
  }
});

program.command("init").action(() => {
  const target = path.join(process.cwd(), ".deploysense.yml");
  if (fs.existsSync(target)) throw new Error(".deploysense.yml already exists");
  fs.writeFileSync(target, "version: 1\nignore:\n  - node_modules/\n  - dist/\nrules:\n  disable: []\nfailOn: high\noutput: terminal\n");
  console.log(chalk.green("Created .deploysense.yml"));
});

program.parse();

function scanFile(filePath: string, forced = "auto"): ScanResult {
  const content = fs.readFileSync(filePath, "utf8");
  return scanContent(content, filePath, forced);
}

function scanDirectory(root: string, config: Config, options: Record<string, unknown>): ProjectReport {
  const files = findScannableFiles(root, config.ignore ?? []);
  return createProjectReport(files.map((file) => scanFile(file, options.scanner as string)), root);
}

function outputResult(result: ScanResult, options: Record<string, unknown>) {
  if (options.json) console.log(toJson(result));
  else if (options.markdown) console.log(toMarkdown(result));
  else if (options.sarif) console.log(toSarif(result));
  else if (options.quiet) console.log(`${result.score}/100 ${result.grade} issues=${result.summary.total}`);
  else console.log(boxen(toTerminal(result, options.color !== false), { padding: 0, borderColor: "cyan" }));
}

function outputProject(report: ProjectReport, options: Record<string, unknown>) {
  if (options.json) console.log(toJson(report));
  else if (options.markdown) console.log(projectToMarkdown(report));
  else if (options.sarif) console.log(toSarif(report.scanResults[0] ?? emptyScan()));
  else if (options.quiet) console.log(`${report.overallScore}/100 ${report.overallGrade} files=${report.scanResults.length} issues=${report.totalIssues}`);
  else {
    console.log(chalk.cyan.bold("DeploySense Project Report"));
    console.log(`Overall: ${report.overallScore}/100 [${report.overallGrade}]`);
    console.log(`Files scanned: ${report.scanResults.length}  Issues: ${report.totalIssues}`);
    for (const result of report.scanResults) {
      console.log(`- ${result.file}: ${result.score}/100 ${result.grade} (${result.summary.total} issues)`);
    }
    if (report.topIssues.length) {
      console.log(chalk.bold("\nTop Issues"));
      for (const issue of report.topIssues) console.log(`- [${issue.severity}] ${issue.id} ${issue.file}: ${issue.fix}`);
    }
  }
}

function filterResult(result: ScanResult, severity?: Severity): ScanResult {
  if (!severity) return result;
  const threshold = severities.indexOf(severity);
  return { ...result, issues: result.issues.filter((issue) => severities.indexOf(issue.severity) <= threshold) };
}

function exitIfNeeded(results: ScanResult[], failOn?: Severity) {
  if (!failOn) return;
  const threshold = severities.indexOf(failOn);
  if (results.some((result) => result.issues.some((issue) => severities.indexOf(issue.severity) <= threshold))) {
    process.exitCode = 1;
  }
}

function applyAndWriteFixes(filePath: string, result: ScanResult, yes: boolean) {
  const content = fs.readFileSync(filePath, "utf8");
  const fixed = applyFixes(content, result.issues);
  if (!fixed.appliedFixes.length) {
    console.log(chalk.yellow("No safe auto-fixes available."));
    return;
  }
  console.log(chalk.bold("Auto-fix preview"));
  for (const fix of fixed.appliedFixes) console.log(`- ${fix.ruleId}: ${fix.description}`);
  if (!yes) {
    console.log(chalk.yellow("Dry run only. Re-run with --yes to write changes."));
    return;
  }
  fs.copyFileSync(filePath, `${filePath}.deploysense.bak`);
  fs.writeFileSync(filePath, fixed.fixed);
  console.log(chalk.green(`Applied ${fixed.appliedFixes.length} fixes. Backup: ${filePath}.deploysense.bak`));
}

function allRules() {
  return [
    ...listDockerRules().map((rule) => ({ scanner: "dockerfile", ...rule })),
    ...listGithubActionsRules().map((rule) => ({ scanner: "github-actions", ...rule })),
    ...listK8sRules().map((rule) => ({ scanner: "kubernetes", ...rule })),
    ...listComposeRules().map((rule) => ({ scanner: "compose", ...rule }))
  ];
}

function loadConfig(root: string): Config {
  const file = path.join(root, ".deploysense.yml");
  if (!fs.existsSync(file)) return {};
  return YAML.parse(fs.readFileSync(file, "utf8")) as Config;
}

function emptyScan(): ScanResult {
  return {
    tool: "dockerfile",
    file: "",
    score: 100,
    grade: "A",
    status: "excellent",
    categoryScores: { security: 100, reliability: 100, performance: 100, cost: 100, maintainability: 100, cicd_quality: 100 },
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
    issues: [],
    scanDurationMs: 0,
    timestamp: new Date().toISOString()
  };
}
