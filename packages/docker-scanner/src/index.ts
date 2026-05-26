import { RuleEngine } from "@deploysense/scanner-core";
import type { RuleMetadata } from "@deploysense/scanner-core";
import type { DockerScanContext } from "./context";
import { inferDockerContext } from "./context";
import { parseDockerfile } from "./parser";
import { dockerRules } from "./rules";

export type { DockerScanContext } from "./context";
export { parseDockerfile } from "./parser";
export { dockerRules } from "./rules";

export interface ScanDockerfileOptions {
  context?: Partial<DockerScanContext> | false;
}

export function scanDockerfile(content: string, filePath = "Dockerfile", options: ScanDockerfileOptions = {}) {
  const parsed = parseDockerfile(content);
  const context = inferDockerContext(filePath, options.context);
  const engine = new RuleEngine(dockerRules, "dockerfile");
  return engine.scan({
    content,
    filePath,
    lines: content.split(/\r?\n/),
    parsed,
    context: context ? { docker: context } : undefined
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
