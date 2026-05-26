import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const unpinnedDigestRule: Rule = {
  id: "DOCKER_UNPINNED_DIGEST",
  title: "Base image is not pinned by digest",
  severity: "low",
  category: "security",
  tags: ["supply-chain", "pinning"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).from
        .filter((item) => !/@sha256:[a-f0-9]{64}\b/i.test(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Base image uses a tag without an immutable digest.",
          why: "Tags can be retargeted. Digest pinning makes production builds more reproducible and improves supply-chain review.",
          fix: "Pin the base image to a trusted digest, for example node:20-alpine@sha256:<digest>.",
          badExample: item.raw,
          goodExample: "FROM node:20-alpine@sha256:<trusted-digest>",
          diffPreview: `- ${item.raw}\n+ FROM node:20-alpine@sha256:<trusted-digest>`,
          confidence: /:latest\b/i.test(item.arguments) ? 0.92 : 0.78,
          falsePositiveRisk: "medium",
          fixFeasibility: "manual"
        }))
    };
  }
};
