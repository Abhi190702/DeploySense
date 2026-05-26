import type { Rule } from "@deploysense/scanner-core";
import { hasAnyShellCommand, shellWords } from "../shell";
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
    const broadCopy = parsed.copy.find((item) => isBroadCopyToWorkdir(item.arguments));
    const install = parsed.run.find((item) => hasAnyShellCommand(item.arguments, [["npm", "install"], ["pnpm", "install"], ["yarn", "install"], ["pip", "install"], ["pip3", "install"]]));
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

function isBroadCopyToWorkdir(argumentsText: string): boolean {
  const words = shellWords(argumentsText).filter((word) => !word.startsWith("--"));
  if (words.length < 2) return false;
  return words[words.length - 1] === "." && (words[words.length - 2] === "." || words[words.length - 2].endsWith("/"));
}
