import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const noExposeRule: Rule = {
  id: "DOCKER_NO_EXPOSE",
  title: "Missing EXPOSE instruction",
  severity: "low",
  category: "maintainability",
  tags: ["documentation"],
  autoFixable: false,
  check(input) {
    if (docker(input).expose.length) return { issues: [] };
    return {
      issues: [issue(input, {
        message: "The Dockerfile does not document the port used by the application.",
        why: "EXPOSE is documentation for humans and tooling, and it makes runtime expectations easier to inspect.",
        fix: "Add EXPOSE <port>, such as EXPOSE 3000 for a Node web app.",
        badExample: "CMD [\"npm\", \"start\"]",
        goodExample: "EXPOSE 3000\nCMD [\"npm\", \"start\"]",
        diffPreview: "+ EXPOSE 3000"
      })]
    };
  }
};
