import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const pipNoCacheDirRule: Rule = {
  id: "DOCKER_PIP_NO_CACHE_DIR",
  title: "pip install should disable cache",
  severity: "low",
  category: "performance",
  tags: ["python", "image-size"],
  autoFixable: true,
  check(input) {
    return {
      issues: docker(input).run
        .filter((item) => /\bpip(3)?\s+install\b/i.test(item.arguments))
        .filter((item) => !/\b--no-cache-dir\b/i.test(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "pip cache is kept in the image layer.",
          why: "pip caches downloaded packages by default, which makes Python images larger without improving runtime behavior.",
          fix: "Add --no-cache-dir to pip install commands.",
          badExample: item.raw,
          goodExample: item.raw.replace(/\bpip(3)?\s+install\b/i, (match) => `${match} --no-cache-dir`),
          diffPreview: `- ${item.raw}\n+ ${item.raw.replace(/\bpip(3)?\s+install\b/i, (match) => `${match} --no-cache-dir`)}`,
          confidence: 0.95,
          falsePositiveRisk: "low",
          fixFeasibility: "high",
          autoFixable: true
        }))
    };
  }
};
