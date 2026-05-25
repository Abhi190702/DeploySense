import { describe, expect, it } from "vitest";
import { applyFixes } from "./autofix";
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
    const report = createProjectReport([sampleResult], ".");
    expect(report.overallScore).toBe(92);
    expect(projectToMarkdown(report)).toContain("Project Report");
  });

  it("applies safe fixes", () => {
    const fixed = applyFixes("FROM node:latest\n", [sampleIssue]);
    expect(fixed.success).toBe(true);
    expect(fixed.fixed).toContain("node:stable");
  });
});
