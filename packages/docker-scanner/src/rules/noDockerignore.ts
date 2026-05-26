import type { Rule } from "@deploysense/scanner-core";
import { context, docker, issue } from "./helpers";

export const noDockerignoreRule: Rule = {
  id: "DOCKER_NO_DOCKERIGNORE",
  title: "COPY . . should be paired with .dockerignore",
  severity: "medium",
  category: "performance",
  tags: ["build-context"],
  autoFixable: false,
  check(input) {
    const ctx = context(input);
    const hasStrongDockerignore = ctx?.dockerignore.exists && ctx.dockerignore.ignoresBuildNoise && ctx.dockerignore.ignoresSecrets;
    if (hasStrongDockerignore) return { issues: [] };

    return {
      issues: docker(input).copy
        .filter((item) => item.arguments.trim() === ". .")
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: ctx?.dockerignore.exists
            ? ".dockerignore exists but does not exclude enough risky build-context files."
            : "Broad COPY detected without a verified .dockerignore.",
          why: "Large build contexts slow Docker builds and can accidentally include .env files, node_modules, git history, credentials, or coverage output.",
          fix: "Create or strengthen .dockerignore with node_modules, .git, .env, *.pem, *.key, .npmrc, dist, coverage.",
          badExample: item.raw,
          goodExample: ".dockerignore:\nnode_modules\n.git\n.env\n*.pem\n*.key\n.npmrc\ndist\ncoverage",
          diffPreview: "+ node_modules\n+ .git\n+ .env\n+ *.pem\n+ *.key\n+ .npmrc\n+ dist\n+ coverage",
          confidence: ctx ? 0.9 : 0.72,
          falsePositiveRisk: ctx ? "low" : "medium",
          fixFeasibility: "high",
          evidence: ctx ? [
            `.dockerignore exists: ${ctx.dockerignore.exists}`,
            `ignores build noise: ${ctx.dockerignore.ignoresBuildNoise}`,
            `ignores secrets: ${ctx.dockerignore.ignoresSecrets}`
          ] : ["No filesystem context was available, so broad COPY is treated as risky."]
        }))
    };
  }
};
