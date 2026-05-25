import crypto from "node:crypto";
import { scanCompose } from "@deploysense/compose-scanner";
import { scanDockerfile } from "@deploysense/docker-scanner";
import { scanGithubActions } from "@deploysense/github-actions-scanner";
import { scanKubernetes } from "@deploysense/k8s-scanner";
import type { ScanResult, ScannerTool } from "@deploysense/scanner-core";

const cache = new Map<string, { expiresAt: number; result: ScanResult }>();

export function detectScanner(fileName: string, content: string): Exclude<ScannerTool, "logs"> {
  const name = fileName.replace(/\\/g, "/").toLowerCase();
  if (name.endsWith("dockerfile") || name.endsWith(".dockerfile")) return "dockerfile";
  if (name.includes(".github/workflows/")) return "github-actions";
  if (/docker-compose.*\.ya?ml$|compose\.ya?ml$/.test(name)) return "compose";
  if (/\bservices:\s*[\r\n]/i.test(content)) return "compose";
  if (/\bkind:\s*(deployment|service|ingress|pod|statefulset|daemonset|horizontalpodautoscaler|configmap|secret)\b/i.test(content)) return "kubernetes";
  return "dockerfile";
}

export function scanByType(type: Exclude<ScannerTool, "logs">, content: string, fileName: string): ScanResult {
  const key = crypto.createHash("sha256").update(`${type}:${fileName}:${content}`).digest("hex");
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.result, scanDurationMs: 0, timestamp: new Date().toISOString() };

  let result: ScanResult;
  if (type === "dockerfile") result = scanDockerfile(content, fileName);
  else if (type === "github-actions") result = scanGithubActions(content, fileName);
  else if (type === "kubernetes") result = scanKubernetes(content, fileName);
  else result = scanCompose(content, fileName);
  cache.set(key, { result, expiresAt: Date.now() + 60_000 });
  return result;
}
