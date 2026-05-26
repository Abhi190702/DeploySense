import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand } from "../shell";
import { docker, issue } from "./helpers";

export const aptUpdateSplitRule: Rule = {
  id: "DOCKER_APT_UPDATE_SPLIT",
  title: "apt-get update is split from install",
  severity: "medium",
  category: "reliability",
  tags: ["reproducibility", "package-manager"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).run
        .filter((item) => hasAnyShellCommand(item.arguments, [["apt-get", "update"], ["apt", "update"]]))
        .filter((item) => !hasAnyShellCommand(item.arguments, [["apt-get", "install"], ["apt", "install"]]))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "apt-get update runs without apt-get install in the same layer.",
          why: "Docker may cache the update layer while package indexes become stale, causing flaky builds or installing unexpected package versions.",
          fix: "Combine apt-get update, apt-get install, and apt list cleanup in a single RUN instruction.",
          badExample: `${item.raw}\nRUN apt-get install -y curl`,
          goodExample: "RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*",
          diffPreview: `- ${item.raw}\n- RUN apt-get install -y curl\n+ RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*`,
          confidence: 0.88,
          falsePositiveRisk: "medium",
          fixFeasibility: "medium"
        }))
    };
  }
};
