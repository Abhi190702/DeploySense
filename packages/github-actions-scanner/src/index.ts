import { RuleEngine } from "@deploysense/scanner-core";
import type { RuleMetadata } from "@deploysense/scanner-core";
import { parseWorkflow } from "./parser";
import { githubActionsRules } from "./rules";

export { parseWorkflow } from "./parser";
export { githubActionsRules } from "./rules";

export function scanGithubActions(content: string, filePath = ".github/workflows/workflow.yml") {
  const parsed = parseWorkflow(content);
  return new RuleEngine(githubActionsRules, "github-actions").scan({
    content,
    filePath,
    lines: content.split(/\r?\n/),
    parsed
  });
}

export function listGithubActionsRules(): RuleMetadata[] {
  return githubActionsRules.map((rule) => ({
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    tags: rule.tags ?? [],
    autoFixable: rule.autoFixable ?? false
  }));
}
