import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const apkNoCacheRule: Rule = {
  id: "DOCKER_APK_NO_CACHE",
  title: "apk add should use --no-cache",
  severity: "low",
  category: "performance",
  tags: ["image-size", "alpine"],
  autoFixable: true,
  check(input) {
    return {
      issues: docker(input).run
        .filter((item) => /\bapk\s+add\b/i.test(item.arguments))
        .filter((item) => !/\b--no-cache\b/i.test(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Alpine packages are installed without --no-cache.",
          why: "apk caches package indexes unless --no-cache is used, increasing final image size.",
          fix: "Add --no-cache to apk add commands.",
          badExample: item.raw,
          goodExample: item.raw.replace(/\bapk\s+add\b/i, "apk add --no-cache"),
          diffPreview: `- ${item.raw}\n+ ${item.raw.replace(/\bapk\s+add\b/i, "apk add --no-cache")}`,
          confidence: 0.96,
          falsePositiveRisk: "low",
          fixFeasibility: "high",
          autoFixable: true
        }))
    };
  }
};
