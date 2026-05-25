import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const latestTagRule: Rule = {
  id: "DOCKER_LATEST_TAG",
  title: "Avoid using latest tag",
  severity: "medium",
  category: "reliability",
  tags: ["best-practice", "pinning"],
  autoFixable: true,
  check(input) {
    const issues = docker(input).from
      .filter((item) => /:latest(\s|$)/i.test(item.arguments))
      .map((item) => issue(input, {
        line: item.lineNumber,
        message: "Base image uses the floating latest tag.",
        why: "The latest tag can change without warning, making builds non-reproducible and deployments harder to roll back.",
        fix: "Pin the image to a specific version such as node:20-alpine.",
        badExample: item.raw,
        goodExample: item.raw.replace(/:latest\b/i, ":20-alpine"),
        diffPreview: `- ${item.raw}\n+ ${item.raw.replace(/:latest\b/i, ":20-alpine")}`,
        autoFixable: true
      }));
    return { issues };
  }
};
