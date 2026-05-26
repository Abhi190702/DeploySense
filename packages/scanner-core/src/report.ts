import type { Issue, ProjectReport, ScanResult, Severity } from "./types";

const color = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  orange: "\u001b[38;5;208m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  gray: "\u001b[90m",
  green: "\u001b[32m",
  cyan: "\u001b[36m"
};

const severityColors: Record<Severity, string> = {
  critical: color.red,
  high: color.orange,
  medium: color.yellow,
  low: color.blue,
  info: color.gray
};

function scoreColor(score: number): string {
  if (score >= 80) return color.green;
  if (score >= 60) return color.yellow;
  if (score >= 40) return color.orange;
  return color.red;
}

function bar(score: number): string {
  const filled = Math.round(score / 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
}

function issueLine(issue: Issue): string {
  const sev = severityColors[issue.severity];
  const loc = issue.line ? `Line: ${issue.line}` : "Location: file-level";
  const metadata = [
    issue.confidence !== undefined ? `Confidence: ${Math.round(issue.confidence * 100)}%` : undefined,
    issue.fixFeasibility ? `Fix feasibility: ${issue.fixFeasibility}` : undefined
  ].filter(Boolean).join("   ");
  return [
    `${sev}[${issue.severity.toUpperCase()}]${color.reset} ${color.bold}${issue.id}${color.reset}`,
    issue.title,
    `${loc}${issue.line ? ` -> ${issue.badExample ?? ""}` : ""}`,
    metadata,
    `Why: ${issue.why}`,
    `Fix: ${issue.fix}`
  ].filter(Boolean).join("\n");
}

export function toJson(result: ScanResult | ProjectReport): string {
  return JSON.stringify(result, null, 2);
}

export function toMarkdown(result: ScanResult): string {
  const escapeMarkdownTableCell = (value: string): string => value.split("\\").join("\\\\").split("|").join("\\|");
  const rows = result.issues
    .map((issue) => `| ${issue.severity} | ${issue.id} | ${issue.file}:${issue.line ?? "file-level"} | ${escapeMarkdownTableCell(issue.fix)} |`)
    .join("\n");

  return `# DeploySense Report

**File:** \`${result.file}\`  
**Scanner:** ${result.tool}  
**Score:** ${result.score}/100 (${result.grade})  
**Status:** ${result.status.replace("_", " ")}

## Summary

| Critical | High | Medium | Low | Info | Total |
|---:|---:|---:|---:|---:|---:|
| ${result.summary.critical} | ${result.summary.high} | ${result.summary.medium} | ${result.summary.low} | ${result.summary.info} | ${result.summary.total} |

## Issues

| Severity | Rule | Location | Fix |
|---|---|---|---|
${rows || "| - | - | - | No issues found |"}
`;
}

export function toTerminal(result: ScanResult, useColor = true): string {
  const c = useColor ? color : Object.fromEntries(Object.keys(color).map((key) => [key, ""])) as typeof color;
  const issueBlocks = result.issues.map((issue) => issueLine(issue)).join(`\n${c.dim}──────────────────────────────────────────${c.reset}\n`);
  const status = result.status.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const score = `${scoreColor(result.score)}${bar(result.score)}${c.reset} ${result.score}/100`;

  return `
  ╔═══════════════════════════════════════╗
  ║         DeploySense v0.1.1            ║
  ║    Open-source DevOps Intelligence    ║
  ╚═══════════════════════════════════════╝

  Scanning: ${result.file}
  ──────────────────────────────────────────

  Score: ${result.score}/100  [${result.grade}]  ${status}
  ${score}

  Issues Found: ${result.summary.total}
  ● Critical: ${result.summary.critical}   ● High: ${result.summary.high}   ● Medium: ${result.summary.medium}   ● Low: ${result.summary.low}   ● Info: ${result.summary.info}

  ──────────────────────────────────────────

${issueBlocks || "  No issues found. Ship it with confidence."}

  Scan completed in ${result.scanDurationMs}ms
`;
}

export function projectToMarkdown(report: ProjectReport): string {
  const rows = report.scanResults
    .map((result) => `| ${result.tool} | ${result.file} | ${result.score}/100 | ${result.summary.total} |`)
    .join("\n");
  return `# DeploySense Project Report

**Overall Score:** ${report.overallScore}/100 (${report.overallGrade})  
**Files Scanned:** ${report.scanResults.length}  
**Total Issues:** ${report.totalIssues}

| Scanner | File | Score | Issues |
|---|---|---:|---:|
${rows}

## Top Issues

${report.topIssues.map((issue) => `- **${issue.severity.toUpperCase()}** ${issue.id}: ${issue.fix}`).join("\n")}
`;
}
