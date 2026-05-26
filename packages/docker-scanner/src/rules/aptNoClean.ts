import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand, hasAptListCleanup, hasShellOption } from "../shell";
import { docker, issue } from "./helpers";

export const aptNoCleanRule: Rule = {
  id: "DOCKER_APT_NO_CLEAN",
  title: "apt-get install does not clean package lists",
  severity: "low",
  category: "performance",
  tags: ["image-size"],
  autoFixable: true,
  check(input) {
    return {
      issues: docker(input).run
        .filter((item) => hasAnyShellCommand(item.arguments, [["apt-get", "install"], ["apt", "install"]]))
        .filter((item) => !hasAptListCleanup(item.arguments) || !hasShellOption(item.arguments, "--no-install-recommends"))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "apt-get install should avoid recommended packages and clean apt lists.",
          why: "Leaving apt lists and recommended packages in the layer increases image size and pull time.",
          fix: "Use --no-install-recommends and rm -rf /var/lib/apt/lists/* in the same RUN layer.",
          badExample: item.raw,
          goodExample: "RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*",
          diffPreview: `- ${item.raw}\n+ RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*`,
          autoFixable: true
        }))
    };
  }
};
