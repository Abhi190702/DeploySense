import type { Rule } from "@deploysense/scanner-core";
import { context, docker, issue } from "./helpers";

const secretPathPattern = /(^|\s|["'])(\.env(\.|$)|\.npmrc\b|\.pypirc\b|\.aws\b|\.ssh\b|id_rsa\b|[^"' ]+\.(pem|key|p12|pfx)\b)/i;

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
        .filter((item) => secretPathPattern.test(item.arguments) || (item.arguments.trim() === ". ." && ctx?.dockerignore.exists && !ctx.dockerignore.ignoresSecrets))
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Dockerfile can copy credential-like files into the image build context.",
          why: "Secrets copied into Docker layers can remain recoverable through image history, registries, or intermediate layers even after later deletion.",
          fix: "Exclude secret files in .dockerignore and inject secrets only at runtime through the orchestrator or secret manager.",
          badExample: item.raw,
          goodExample: ".dockerignore:\n.env\n.env*\n*.pem\n*.key\n.npmrc\n.aws\n.ssh",
          diffPreview: `- ${item.raw}\n+ # keep secret files out of COPY/ADD and exclude them in .dockerignore`,
          confidence: secretPathPattern.test(item.arguments) ? 0.98 : 0.85,
          falsePositiveRisk: secretPathPattern.test(item.arguments) ? "low" : "medium",
          fixFeasibility: "high",
          evidence: ctx ? [
            `.dockerignore exists: ${ctx.dockerignore.exists}`,
            `ignores secrets: ${ctx.dockerignore.ignoresSecrets}`
          ] : undefined
        }))
    };
  }
};
