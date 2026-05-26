import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const addRemoteUrlRule: Rule = {
  id: "DOCKER_ADD_REMOTE_URL",
  title: "Remote URL used with ADD",
  severity: "high",
  category: "security",
  tags: ["supply-chain", "network"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).add
        .filter((item) => /^https?:\/\//i.test(item.arguments.trim()))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Dockerfile downloads remote content with ADD.",
          why: "Remote ADD hides a network fetch inside the build and usually skips checksum verification, which weakens supply-chain review and reproducibility.",
          fix: "Download with curl/wget in a RUN step, verify a pinned checksum, then unpack explicitly.",
          badExample: item.raw,
          goodExample: "ARG TOOL_SHA256=<expected-sha256>\nRUN wget -O /tmp/tool.tgz https://example.com/tool.tgz && \\\n    echo \"$TOOL_SHA256  /tmp/tool.tgz\" | sha256sum -c -",
          diffPreview: `- ${item.raw}\n+ ARG TOOL_SHA256=<expected-sha256>\n+ RUN wget -O /tmp/tool.tgz https://example.com/tool.tgz && echo \"$TOOL_SHA256  /tmp/tool.tgz\" | sha256sum -c -`,
          confidence: 0.95,
          falsePositiveRisk: "low",
          fixFeasibility: "medium"
        }))
    };
  }
};
