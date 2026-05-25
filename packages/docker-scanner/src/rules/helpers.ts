import type { RuleInput } from "@deploysense/scanner-core";
import type { ParsedDockerfile } from "../parser";

export function docker(input: RuleInput): ParsedDockerfile {
  return input.parsed as ParsedDockerfile;
}

export function issue(input: RuleInput, data: {
  line?: number;
  message: string;
  why: string;
  fix: string;
  badExample: string;
  goodExample: string;
  diffPreview: string;
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
    autoFixable: data.autoFixable ?? false
  };
}
