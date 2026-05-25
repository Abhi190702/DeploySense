import { calculateScore, summarizeIssues } from "./scoring";
import type { Issue, Rule, RuleInput, ScanResult, ScannerTool } from "./types";

export interface RunRulesOptions {
  tool: ScannerTool;
  filePath: string;
}

export function runRules(rules: Rule[], input: RuleInput): Issue[] {
  const issues: Issue[] = [];
  for (const rule of rules) {
    const output = rule.check(input);
    for (const issue of output.issues) {
      issues.push({
        ...issue,
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        category: rule.category,
        tags: issue.tags ?? rule.tags ?? [],
        autoFixable: issue.autoFixable ?? rule.autoFixable ?? false
      });
    }
  }
  return issues;
}

export class RuleEngine {
  constructor(private readonly rules: Rule[], private readonly tool: ScannerTool) {}

  scan(input: RuleInput): ScanResult {
    const started = Date.now();
    const issues = runRules(this.rules, input);
    const scored = calculateScore(issues);
    return {
      tool: this.tool,
      file: input.filePath,
      ...scored,
      summary: summarizeIssues(issues),
      issues,
      scanDurationMs: Date.now() - started,
      timestamp: new Date().toISOString()
    };
  }
}
