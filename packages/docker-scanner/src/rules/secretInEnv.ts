import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

const secretPattern = /(PASSWORD|SECRET|TOKEN|API_KEY|KEY)/i;

export const secretInEnvRule: Rule = {
  id: "DOCKER_SECRET_IN_ENV",
  title: "Secret-like value hardcoded in ENV",
  severity: "critical",
  category: "security",
  tags: ["secrets"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).env
        .filter((item) => secretPattern.test(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Dockerfile ENV instruction appears to contain a secret.",
          why: "Secrets baked into image layers remain visible in image history and registries even if later removed.",
          fix: "Use Docker secrets, runtime environment variables, or a secret manager instead of hardcoding values.",
          badExample: item.raw,
          goodExample: "ENV NODE_ENV=production\n# Inject secrets at runtime",
          diffPreview: `- ${item.raw}\n+ # Inject ${item.arguments.split(/[=\s]/)[0]} at runtime`
        }))
    };
  }
};
