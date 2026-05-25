import { RuleEngine } from "@deploysense/scanner-core";
import type { RuleMetadata } from "@deploysense/scanner-core";
import { parseCompose } from "./parser";
import { composeRules } from "./rules";

export { parseCompose } from "./parser";
export { composeRules } from "./rules";

export function scanCompose(content: string, filePath = "docker-compose.yml") {
  const parsed = parseCompose(content);
  return new RuleEngine(composeRules, "compose").scan({
    content,
    filePath,
    lines: content.split(/\r?\n/),
    parsed
  });
}

export function listComposeRules(): RuleMetadata[] {
  return composeRules.map((rule) => ({
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    tags: rule.tags ?? [],
    autoFixable: rule.autoFixable ?? false
  }));
}
