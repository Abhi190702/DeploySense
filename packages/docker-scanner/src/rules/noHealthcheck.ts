import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const noHealthcheckRule: Rule = {
  id: "DOCKER_NO_HEALTHCHECK",
  title: "Missing HEALTHCHECK instruction",
  severity: "high",
  category: "reliability",
  tags: ["runtime", "availability"],
  autoFixable: false,
  check(input) {
    if (docker(input).healthcheck.length) return { issues: [] };
    return {
      issues: [issue(input, {
        message: "Docker cannot verify if this container is healthy.",
        why: "A container process can keep running while the application inside is broken. Health checks let Docker, Compose, and orchestrators detect that state.",
        fix: "Add HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1.",
        badExample: "CMD [\"npm\", \"start\"]",
        goodExample: "HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1\nCMD [\"npm\", \"start\"]",
        diffPreview: "+ HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1"
      })]
    };
  }
};
