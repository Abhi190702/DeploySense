import { RuleEngine } from "@deploysense/scanner-core";
import type { RuleMetadata } from "@deploysense/scanner-core";
import { parseDockerfile } from "./parser";
import { dockerRules } from "./rules";

export { parseDockerfile } from "./parser";
export { dockerRules } from "./rules";

export function scanDockerfile(content: string, filePath = "Dockerfile") {
  const parsed = parseDockerfile(content);
  const engine = new RuleEngine(dockerRules, "dockerfile");
  return engine.scan({
    content,
    filePath,
    lines: content.split(/\r?\n/),
    parsed
  });
}

export function listDockerRules(): RuleMetadata[] {
  return dockerRules.map((rule) => ({
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    tags: rule.tags ?? [],
    autoFixable: rule.autoFixable ?? false
  }));
}
