import type { Rule } from "@deploysense/scanner-core";
import { isLargeLinuxBase } from "../image";
import { docker, issue } from "./helpers";

export const largeBaseImageRule: Rule = {
  id: "DOCKER_LARGE_BASE_IMAGE",
  title: "Large base image",
  severity: "low",
  category: "performance",
  tags: ["image-size"],
  autoFixable: true,
  check(input) {
    return {
      issues: docker(input).from
        .filter((item) => isLargeLinuxBase(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Base image is a full Linux distribution.",
          why: "Full distro images increase attack surface, build time, and pull time.",
          fix: "Use a slim or alpine image where compatible.",
          badExample: item.raw,
          goodExample: "FROM debian:bookworm-slim",
          diffPreview: `- ${item.raw}\n+ FROM debian:bookworm-slim`,
          autoFixable: true
        }))
    };
  }
};
