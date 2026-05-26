import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand, replaceFirstShellCommand } from "../shell";
import { context, docker, issue } from "./helpers";

export const npmInstallNotCiRule: Rule = {
  id: "DOCKER_NPM_INSTALL_NOT_CI",
  title: "npm install used instead of npm ci",
  severity: "medium",
  category: "reliability",
  tags: ["node", "reproducibility"],
  autoFixable: false,
  check(input) {
    const ctx = context(input);
    const hasLockfile = ctx?.lockfiles.some((file) => ["package-lock.json", "npm-shrinkwrap.json"].includes(file)) ?? false;
    return {
      issues: docker(input).run
        .filter((item) => hasAnyShellCommand(item.arguments, [["npm", "install"]]))
        .filter(() => hasLockfile || !ctx)
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "npm install is less reproducible than npm ci for locked applications.",
          why: "npm install may update the dependency tree, while npm ci installs exactly what is in the lockfile and fails if package.json and the lockfile disagree.",
          fix: hasLockfile ? "Use npm ci in CI/Docker builds." : "If the project has a package-lock.json, use npm ci in CI/Docker builds.",
          badExample: item.raw,
          goodExample: replaceFirstShellCommand(item.raw, ["npm", "install"], "npm ci"),
          diffPreview: `- ${item.raw}\n+ ${replaceFirstShellCommand(item.raw, ["npm", "install"], "npm ci")}`,
          confidence: hasLockfile ? 0.95 : 0.68,
          falsePositiveRisk: hasLockfile ? "low" : "medium",
          fixFeasibility: "high",
          evidence: ctx ? [`lockfiles: ${ctx.lockfiles.join(", ") || "none"}`] : ["No filesystem context was available."]
        }))
    };
  }
};
