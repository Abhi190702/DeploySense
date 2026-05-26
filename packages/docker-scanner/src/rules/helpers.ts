import type { RuleInput } from "@deploysense/scanner-core";
import { dockerContextFrom } from "../context";
import type { ParsedDockerfile } from "../parser";

export function docker(input: RuleInput): ParsedDockerfile {
  return input.parsed as ParsedDockerfile;
}

export function context(input: RuleInput) {
  return dockerContextFrom(input);
}

export function issue(input: RuleInput, data: {
  line?: number;
  message: string;
  why: string;
  fix: string;
  badExample: string;
  goodExample: string;
  diffPreview: string;
  confidence?: number;
  fixFeasibility?: "high" | "medium" | "low" | "manual";
  falsePositiveRisk?: "low" | "medium" | "high";
  evidence?: string[];
  autoFixable?: boolean;
}) {
  return {
    file: input.filePath,
    line: data.line,
    message: data.message,
    why: data.why,
    fix: data.fix,
    badExample: data.badExample,
    goodExample: data.goodExample,
    diffPreview: data.diffPreview,
    confidence: data.confidence,
    fixFeasibility: data.fixFeasibility,
    falsePositiveRisk: data.falsePositiveRisk,
    evidence: data.evidence,
    autoFixable: data.autoFixable ?? false
  };
}
