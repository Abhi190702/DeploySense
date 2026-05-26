import type { Rule } from "@deploysense/scanner-core";
import { looksBuildHeavyBase } from "../image";
import { docker, issue } from "./helpers";

export const noMultiStageRule: Rule = {
  id: "DOCKER_NO_MULTI_STAGE",
  title: "Consider a multi-stage build",
  severity: "info",
  category: "performance",
  tags: ["image-size"],
  autoFixable: false,
  check(input) {
    const parsed = docker(input);
    const first = parsed.from[0]?.arguments ?? "";
    const looksBuildHeavy = looksBuildHeavyBase(first);
    if (!looksBuildHeavy || parsed.from.length > 1) return { issues: [] };
    return {
      issues: [issue(input, {
        line: parsed.from[0]?.lineNumber,
        message: "Node.js or Java image uses a single build stage.",
        why: "Build tools and source files often do not need to be present in the final runtime image.",
        fix: "Use a builder stage for dependencies/build output and a smaller runtime stage.",
        badExample: parsed.from[0]?.raw ?? "FROM node:20",
        goodExample: "FROM node:20-alpine AS build\nRUN npm ci && npm run build\nFROM node:20-alpine\nCOPY --from=build /app/dist ./dist",
        diffPreview: "+ FROM node:20-alpine AS build\n+ FROM node:20-alpine\n+ COPY --from=build /app/dist ./dist"
      })]
    };
  }
};
