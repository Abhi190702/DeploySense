import { describe, expect, it } from "vitest";
import { applyFixes } from "./autofix";
import { analyzeArchitecture } from "./architecture";
import { RuleEngine } from "./engine";
import { createProjectReport } from "./project";
import { projectToMarkdown, toJson, toMarkdown, toTerminal } from "./report";
import { toSarif } from "./sarif";
import type { Issue, Rule, ScanResult } from "./types";

const sampleIssue: Issue = {
  id: "DOCKER_LATEST_TAG",
  title: "Avoid latest",
  severity: "medium",
  category: "reliability",
  file: "Dockerfile",
  line: 1,
  message: "message",
  why: "why",
  fix: "fix",
  badExample: "FROM node:latest",
  goodExample: "FROM node:20-alpine",
  diffPreview: "- FROM node:latest\n+ FROM node:20-alpine",
  autoFixable: true
};

const sampleResult: ScanResult = {
  tool: "dockerfile",
  file: "Dockerfile",
  score: 92,
  grade: "A",
  status: "excellent",
  categoryScores: { security: 100, reliability: 92, performance: 100, cost: 100, maintainability: 100, cicd_quality: 100 },
  summary: { critical: 0, high: 0, medium: 1, low: 0, info: 0, total: 1 },
  issues: [sampleIssue],
  scanDurationMs: 5,
  timestamp: "2026-05-25T00:00:00.000Z"
};

describe("core utilities", () => {
  it("runs rules with engine metadata", () => {
    const rule: Rule = {
      id: "TEST_RULE",
      title: "Test rule",
      severity: "low",
      category: "maintainability",
      autoFixable: true,
      check: (input) => ({
        issues: [{
          file: input.filePath,
          message: "message",
          why: "why",
          fix: "fix",
          badExample: "bad",
          goodExample: "good",
          diffPreview: "- bad\n+ good",
          autoFixable: true
        }]
      })
    };
    const result = new RuleEngine([rule], "dockerfile").scan({ content: "x", filePath: "Dockerfile", lines: ["x"] });
    expect(result.issues[0].id).toBe("TEST_RULE");
    expect(result.score).toBe(97);
  });

  it("renders reports and sarif", () => {
    expect(toJson(sampleResult)).toContain("DOCKER_LATEST_TAG");
    expect(toMarkdown(sampleResult)).toContain("DeploySense Report");
    expect(toTerminal(sampleResult, false)).toContain("Score: 92/100");
    expect(toSarif(sampleResult)).toContain("\"version\": \"2.1.0\"");
  });

  it("creates project reports", () => {
    const architecture = analyzeArchitecture([
      { name: "Dockerfile", content: "FROM node:20-alpine\nEXPOSE 3000\n" },
      { name: ".github/workflows/deploy.yml", content: "jobs:\n  deploy:\n    steps:\n      - run: docker build -t ghcr.io/acme/api:1.0 .\n      - run: kubectl apply -f k8s/\n" },
      { name: "k8s/deployment.yaml", content: "kind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      containers:\n        - image: ghcr.io/acme/api:latest\n" }
    ], [sampleResult]);
    const report = createProjectReport([sampleResult], ".", architecture);
    expect(report.overallScore).toBe(92);
    expect(report.architecture?.nodes.length).toBeGreaterThan(2);
    expect(report.architecture?.insights.some((insight) => insight.id === "ARCH_MUTABLE_IMAGE_CHAIN")).toBe(true);
    expect(projectToMarkdown(report)).toContain("Project Report");
  });

  it("applies safe fixes", () => {
    const fixed = applyFixes("FROM node:latest\n", [sampleIssue]);
    expect(fixed.success).toBe(true);
    expect(fixed.fixed).toContain("node:stable");
  });

  it("skips auto-fix on complex Docker here-doc files", () => {
    const fixed = applyFixes("FROM node:latest\nRUN <<EOF\nnpm install\nEOF\n", [sampleIssue]);
    expect(fixed.success).toBe(false);
    expect(fixed.skippedFixes[0].reason).toContain("here-doc");
  });
});
