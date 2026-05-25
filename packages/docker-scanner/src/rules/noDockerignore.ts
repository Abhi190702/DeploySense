import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const noDockerignoreRule: Rule = {
  id: "DOCKER_NO_DOCKERIGNORE",
  title: "COPY . . should be paired with .dockerignore",
  severity: "medium",
  category: "performance",
  tags: ["build-context"],
  autoFixable: false,
  check(input) {
    return {
      issues: docker(input).copy
        .filter((item) => item.arguments.trim() === ". .")
        .map((item) => issue(input, {
          line: item.lineNumber,
          message: "Broad COPY detected. Ensure .dockerignore excludes local-only files.",
          why: "Large build contexts slow Docker builds and can accidentally include .env files, node_modules, git history, or coverage output.",
          fix: "Create .dockerignore with node_modules, .git, .env, dist, coverage.",
          badExample: item.raw,
          goodExample: ".dockerignore:\nnode_modules\n.git\n.env\ndist\ncoverage",
          diffPreview: "+ node_modules\n+ .git\n+ .env\n+ dist\n+ coverage"
        }))
    };
  }
};
