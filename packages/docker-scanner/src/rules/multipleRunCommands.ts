import type { Rule } from "@deploysense/scanner-core";
import { docker, issue } from "./helpers";

export const multipleRunCommandsRule: Rule = {
  id: "DOCKER_MULTIPLE_RUN_COMMANDS",
  title: "Multiple consecutive RUN commands",
  severity: "low",
  category: "performance",
  tags: ["layers"],
  autoFixable: true,
  check(input) {
    const runs = docker(input).run;
    for (let i = 0; i < runs.length - 2; i += 1) {
      const a = runs[i];
      const b = runs[i + 1];
      const c = runs[i + 2];
      if (b.lineNumber === a.lineNumber + 1 && c.lineNumber === b.lineNumber + 1) {
        return {
          issues: [issue(input, {
            line: a.lineNumber,
            message: "Three consecutive RUN commands create avoidable image layers.",
            why: "Each RUN creates a layer. Combining related commands can reduce image size and cache churn.",
            fix: "Combine consecutive RUN commands using && and line continuations.",
            badExample: `${a.raw}\n${b.raw}\n${c.raw}`,
            goodExample: `RUN ${a.arguments} && \\\n    ${b.arguments} && \\\n    ${c.arguments}`,
            diffPreview: `- ${a.raw}\n- ${b.raw}\n- ${c.raw}\n+ RUN ${a.arguments} && \\\n+     ${b.arguments} && \\\n+     ${c.arguments}`,
            autoFixable: true
          })]
        };
      }
    }
    return { issues: [] };
  }
};
