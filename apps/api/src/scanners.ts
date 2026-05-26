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
  if (isComposeFileName(name)) return "compose";
  if (hasTopLevelYamlKey(content, "services")) return "compose";
  if (hasKnownKubernetesKind(content)) return "kubernetes";
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

function isComposeFileName(name: string): boolean {
  return name.endsWith("compose.yaml")
    || name.endsWith("compose.yml")
    || (name.includes("docker-compose") && (name.endsWith(".yaml") || name.endsWith(".yml")));
}

function hasTopLevelYamlKey(content: string, key: string): boolean {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    if (trimmed === `${key}:`) return true;
  }
  return false;
}

function hasKnownKubernetesKind(content: string): boolean {
  const known = new Set(["deployment", "service", "ingress", "pod", "statefulset", "daemonset", "horizontalpodautoscaler", "configmap", "secret"]);
  for (const line of content.split("\n")) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed.startsWith("kind:")) continue;
    const kind = trimmed.slice("kind:".length).trim();
    if (known.has(kind)) return true;
  }
  return false;
}
