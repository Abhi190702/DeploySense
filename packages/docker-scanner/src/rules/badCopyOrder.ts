import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const badCopyOrderRule: Rule = {
  id: "DOCKER_BAD_COPY_ORDER",
  title: "COPY order hurts layer caching",
  severity: "medium",
  category: "performance",
  tags: ["cache", "layers"],
  autoFixable: false,
  check(input) {
    const parsed = docker(input);
    const broadCopy = parsed.copy.find((item) => /^(\.|\S+\/?)\s+\.$/.test(item.arguments) || item.arguments.trim() === ". .");
    const install = parsed.run.find((item) => /(npm|pnpm|yarn)\s+install|pip\s+install/i.test(item.arguments));
    if (!broadCopy || !install || broadCopy.lineNumber > install.lineNumber) return { issues: [] };
    return {
      issues: [issue(input, {
        line: broadCopy.lineNumber,
        message: "Application source is copied before dependency installation.",
        why: "Any source change invalidates the dependency layer, causing slower rebuilds and larger CI wait times.",
        fix: "Copy package manifests first, install dependencies, then copy source.",
        badExample: `${broadCopy.raw}\n${install.raw}`,
        goodExample: "COPY package*.json ./\nRUN npm ci\nCOPY . .",
        diffPreview: "- COPY . .\n- RUN npm install\n+ COPY package*.json ./\n+ RUN npm ci\n+ COPY . ."
      })]
    };
  }
};
