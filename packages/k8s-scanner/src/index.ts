import { RuleEngine } from "@deploysense/scanner-core";
import type { RuleMetadata } from "@deploysense/scanner-core";
import { parseKubernetes } from "./parser";
import { k8sRules } from "./rules";

export { parseKubernetes } from "./parser";
export { k8sRules } from "./rules";

export function scanKubernetes(content: string, filePath = "k8s.yaml") {
  const parsed = parseKubernetes(content);
  return new RuleEngine(k8sRules, "kubernetes").scan({
    content,
    filePath,
    lines: content.split(/\r?\n/),
    parsed
  });
}

export function listK8sRules(): RuleMetadata[] {
  return k8sRules.map((rule) => ({
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    tags: rule.tags ?? [],
    autoFixable: rule.autoFixable ?? false
  }));
}
