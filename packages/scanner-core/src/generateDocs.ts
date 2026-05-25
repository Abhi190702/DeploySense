import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Rule } from "./types";

async function main() {
  const root = path.resolve(__dirname, "../../..");
  const modules = [
    path.join(root, "packages/docker-scanner/src/rules/index.ts"),
    path.join(root, "packages/github-actions-scanner/src/rules/index.ts"),
    path.join(root, "packages/k8s-scanner/src/rules/index.ts"),
    path.join(root, "packages/compose-scanner/src/rules/index.ts")
  ];
  const rules: Rule[] = [];
  for (const modulePath of modules) {
    const mod = await import(pathToFileURL(modulePath).href);
    rules.push(...(mod.dockerRules ?? mod.githubActionsRules ?? mod.k8sRules ?? mod.composeRules));
  }
  const docsDir = path.resolve(root, "docs/rules");
  fs.mkdirSync(docsDir, { recursive: true });
  for (const rule of rules) {
    const file = path.join(docsDir, `${rule.id}.md`);
    fs.writeFileSync(file, `# ${rule.id}

${rule.title}

- Severity: ${rule.severity}
- Category: ${rule.category}
- Auto-fixable: ${rule.autoFixable ? "yes" : "no"}
- Tags: ${(rule.tags ?? []).join(", ") || "none"}

## Description

This rule detects a deployment risk in ${rule.category.replace("_", " ")} and reports a plain-English fix through the DeploySense scanner.

## How to Fix

Run \`deploysense scan <file>\` to see exact file-specific guidance and diff previews.
`);
  }
  console.log(`Generated ${rules.length} rule docs in ${docsDir}`);
}

void main();
