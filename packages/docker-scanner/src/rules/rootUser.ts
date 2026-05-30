import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const rootUserRule: Rule = {
  id: "DOCKER_ROOT_USER",
  title: "Container runs as root",
  severity: "high",
  category: "security",
  tags: ["least-privilege"],
  autoFixable: false,
  check(input) {
    if (docker(input).user.length) return { issues: [] };
    return {
      issues: [issue(input, {
        message: "No USER instruction is present, so the image runs as root by default.",
        why: "Root containers increase blast radius if an attacker escapes the application process or abuses mounted files.",
        fix: "Create or use a non-root user and add USER node or USER appuser before CMD.",
        badExample: "CMD [\"npm\", \"start\"]",
        goodExample: "USER node\nCMD [\"npm\", \"start\"]",
        diffPreview: "+ USER node\n  CMD [\"npm\", \"start\"]",
        autoFixable: true
      })]
    };
  }
};
