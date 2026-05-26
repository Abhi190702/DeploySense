import type { Rule } from "@deploysense/scanner-core";
import { hasDownloadPipedToShell } from "../shell";
import { docker, issue } from "./helpers";

export const curlPipeShellRule: Rule = {
  id: "DOCKER_CURL_PIPE_SHELL",
  title: "Downloaded script piped to shell",
  severity: "critical",
  category: "security",
  tags: ["supply-chain", "remote-code-execution"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).run
        .filter((item) => hasDownloadPipedToShell(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Remote script is executed directly by a shell.",
          why: "Piping downloaded content to a shell gives the network endpoint immediate code execution during build and makes review, pinning, and rollback difficult.",
          fix: "Download the script, verify a pinned checksum or signature, inspect it, then execute it explicitly.",
          badExample: item.raw,
          goodExample: "ARG INSTALLER_SHA256=<expected-sha256>\nRUN curl -fsSL https://example.com/install.sh -o /tmp/install.sh && \\\n    echo \"$INSTALLER_SHA256  /tmp/install.sh\" | sha256sum -c - && \\\n    sh /tmp/install.sh",
          diffPreview: `- ${item.raw}\n+ RUN curl -fsSL https://example.com/install.sh -o /tmp/install.sh && echo \"$INSTALLER_SHA256  /tmp/install.sh\" | sha256sum -c - && sh /tmp/install.sh`,
          confidence: 0.98,
          falsePositiveRisk: "low",
          fixFeasibility: "medium"
        }))
    };
  }
};
