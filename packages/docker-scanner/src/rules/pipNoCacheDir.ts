import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand, hasShellOption, replaceFirstShellCommand } from "../shell";
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
        .filter((item) => hasAnyShellCommand(item.arguments, [["pip", "install"], ["pip3", "install"]]))
        .filter((item) => !hasShellOption(item.arguments, "--no-cache-dir"))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "pip cache is kept in the image layer.",
          why: "pip caches downloaded packages by default, which makes Python images larger without improving runtime behavior.",
          fix: "Add --no-cache-dir to pip install commands.",
          badExample: item.raw,
          goodExample: addNoCacheDir(item.raw),
          diffPreview: `- ${item.raw}\n+ ${addNoCacheDir(item.raw)}`,
          confidence: 0.95,
          falsePositiveRisk: "low",
          fixFeasibility: "high",
          autoFixable: true
        }))
    };
  }
};

function addNoCacheDir(raw: string): string {
  const pip3 = replaceFirstShellCommand(raw, ["pip3", "install"], "pip3 install --no-cache-dir");
  if (pip3 !== raw) return pip3;
  return replaceFirstShellCommand(raw, ["pip", "install"], "pip install --no-cache-dir");
}
