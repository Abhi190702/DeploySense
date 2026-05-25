import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const noWorkdirRule: Rule = {
  id: "DOCKER_NO_WORKDIR",
  title: "Missing WORKDIR instruction",
  severity: "medium",
  category: "reliability",
  tags: ["best-practice"],
  autoFixable: true,
  check(input) {
    if (docker(input).workdir.length) return { issues: [] };
    const firstCopy = docker(input).copy[0];
    return {
      issues: [
        issue(input, {
          line: firstCopy?.lineNumber,
          message: "Dockerfile does not define an application working directory.",
          why: "Without WORKDIR, later COPY, RUN, and CMD instructions execute from the image default directory, which makes runtime behavior fragile.",
          fix: "Add WORKDIR /app before COPY instructions.",
          badExample: firstCopy?.raw ?? "COPY . .",
          goodExample: "WORKDIR /app\nCOPY . .",
          diffPreview: "+ WORKDIR /app\n  COPY . .",
          autoFixable: true
        })
      ]
    };
  }
};
