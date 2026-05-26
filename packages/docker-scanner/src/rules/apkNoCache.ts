import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand, hasShellOption, replaceFirstShellCommand } from "../shell";
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
        .filter((item) => hasAnyShellCommand(item.arguments, [["apk", "add"]]))
        .filter((item) => !hasShellOption(item.arguments, "--no-cache"))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Alpine packages are installed without --no-cache.",
          why: "apk caches package indexes unless --no-cache is used, increasing final image size.",
          fix: "Add --no-cache to apk add commands.",
          badExample: item.raw,
          goodExample: replaceFirstShellCommand(item.raw, ["apk", "add"], "apk add --no-cache"),
          diffPreview: `- ${item.raw}\n+ ${replaceFirstShellCommand(item.raw, ["apk", "add"], "apk add --no-cache")}`,
          confidence: 0.96,
          falsePositiveRisk: "low",
          fixFeasibility: "high",
          autoFixable: true
        }))
    };
  }
};
