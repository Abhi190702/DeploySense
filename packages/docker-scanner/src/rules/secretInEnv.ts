import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

const secretNames = ["PASSWORD", "SECRET", "TOKEN", "API_KEY", "KEY"];

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
        .filter((item) => looksSecretEnv(item.arguments))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Dockerfile ENV instruction appears to contain a secret.",
          why: "Secrets baked into image layers remain visible in image history and registries even if later removed.",
          fix: "Use Docker secrets, runtime environment variables, or a secret manager instead of hardcoding values.",
          badExample: item.raw,
          goodExample: "ENV NODE_ENV=production\n# Inject secrets at runtime",
          diffPreview: `- ${item.raw}\n+ # Inject ${envName(item.arguments)} at runtime`
        }))
    };
  }
};

function looksSecretEnv(argumentsText: string): boolean {
  const name = envName(argumentsText).toUpperCase();
  return secretNames.some((secretName) => {
    if (name === secretName || name.endsWith(`_${secretName}`)) return true;
    return secretName !== "KEY" && name.includes(secretName);
  });
}

function envName(argumentsText: string): string {
  let end = 0;
  while (end < argumentsText.length && argumentsText[end] !== "=" && argumentsText[end] !== " " && argumentsText[end] !== "\t") {
    end += 1;
  }
  return argumentsText.slice(0, end) || "SECRET";
}
