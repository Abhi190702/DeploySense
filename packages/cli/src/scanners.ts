import fs from "node:fs";
import path from "node:path";
import { scanCompose } from "@deploysense/compose-scanner";
import { scanDockerfile } from "@deploysense/docker-scanner";
import { scanGithubActions } from "@deploysense/github-actions-scanner";
import { scanKubernetes } from "@deploysense/k8s-scanner";
import type { ScanResult, ScannerTool } from "@deploysense/scanner-core";

export function detectScanner(filePath: string, content: string): ScannerTool | undefined {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const base = path.basename(normalized);
  const isYaml = /\.(ya?ml)$/.test(normalized);
  if (base === "dockerfile" || normalized.endsWith(".dockerfile")) return "dockerfile";
  if (normalized.includes(".github/workflows/") && isYaml) return "github-actions";
  if (/docker-compose.*\.ya?ml$|compose\.ya?ml$/.test(base)) return "compose";
  if (isYaml && /\bkind:\s*(deployment|service|ingress|pod|statefulset|daemonset|horizontalpodautoscaler|configmap|secret)\b/i.test(content)) return "kubernetes";
  if (isYaml && /\bservices:\s*[\r\n]/i.test(content)) return "compose";
  return undefined;
}

export function scanContent(content: string, filePath: string, forced?: string): ScanResult {
  const scanner = (forced === "auto" || !forced ? detectScanner(filePath, content) : forced) as ScannerTool | undefined;
  if (scanner === "dockerfile") return scanDockerfile(content, filePath);
  if (scanner === "github-actions") return scanGithubActions(content, filePath);
  if (scanner === "kubernetes") return scanKubernetes(content, filePath);
  if (scanner === "compose") return scanCompose(content, filePath);
  throw new Error(`Could not detect scanner for ${filePath}`);
}

export function findScannableFiles(root: string, ignored: string[] = []): string[] {
  const results: string[] = [];
  const ignore = new Set(["node_modules", ".git", "dist", ".next", "coverage", ...ignored.map((item) => item.replace(/[\\\/]+$/, ""))]);
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (!ignore.has(entry.name) && !ignored.some((pattern) => rel.startsWith(pattern.replace(/[\\\/]+$/, "")))) visit(full);
        continue;
      }
      const normalized = rel.replace(/\\/g, "/").toLowerCase();
      const base = path.basename(normalized);
      const isYaml = /\.(ya?ml)$/.test(normalized);
      const isDockerfile = base === "dockerfile" || normalized.endsWith(".dockerfile");
      
      if (!isYaml && !isDockerfile) continue;

      const content = fs.readFileSync(full, "utf8");
      if (detectScanner(rel, content)) results.push(full);
    }
  };
  visit(root);
  return results;
}
