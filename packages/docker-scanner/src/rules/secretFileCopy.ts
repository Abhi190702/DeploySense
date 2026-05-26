import type { Rule } from "@deploysense/scanner-core";
import { shellWords } from "../shell";
import { context, docker, issue } from "./helpers";

export const secretFileCopyRule: Rule = {
  id: "DOCKER_COPY_SECRET_FILES",
  title: "Docker build context may copy secret files",
  severity: "critical",
  category: "security",
  tags: ["secrets", "build-context"],
  autoFixable: false,
  check(input) {
    const ctx = context(input);
    const candidates = [...docker(input).copy, ...docker(input).add];
    return {
      issues: candidates
        .filter((item) => referencesSecretPath(item.arguments) || (item.arguments.trim() === ". ." && ctx?.dockerignore.exists && !ctx.dockerignore.ignoresSecrets))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Dockerfile can copy credential-like files into the image build context.",
          why: "Secrets copied into Docker layers can remain recoverable through image history, registries, or intermediate layers even after later deletion.",
          fix: "Exclude secret files in .dockerignore and inject secrets only at runtime through the orchestrator or secret manager.",
          badExample: item.raw,
          goodExample: ".dockerignore:\n.env\n.env*\n*.pem\n*.key\n.npmrc\n.aws\n.ssh",
          diffPreview: `- ${item.raw}\n+ # keep secret files out of COPY/ADD and exclude them in .dockerignore`,
          confidence: referencesSecretPath(item.arguments) ? 0.98 : 0.85,
          falsePositiveRisk: referencesSecretPath(item.arguments) ? "low" : "medium",
          fixFeasibility: "high",
          evidence: ctx ? [
            `.dockerignore exists: ${ctx.dockerignore.exists}`,
            `ignores secrets: ${ctx.dockerignore.ignoresSecrets}`
          ] : undefined
        }))
    };
  }
};

function referencesSecretPath(argumentsText: string): boolean {
  return shellWords(argumentsText).some((word) => {
    const lower = trimQuotes(word).toLowerCase();
    const name = lower.slice(lower.lastIndexOf("/") + 1);
    if ([".env", ".npmrc", ".pypirc", ".aws", ".ssh", "id_rsa"].includes(name)) return true;
    if (name.startsWith(".env.")) return true;
    return [".pem", ".key", ".p12", ".pfx"].some((extension) => name.endsWith(extension));
  });
}

function trimQuotes(value: string): string {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}
