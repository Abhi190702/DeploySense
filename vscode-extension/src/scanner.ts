import type * as vscode from "vscode";
import { scanCompose } from "@deploysense/compose-scanner";
import { scanDockerfile } from "@deploysense/docker-scanner";
import { scanGithubActions } from "@deploysense/github-actions-scanner";
import { scanKubernetes } from "@deploysense/k8s-scanner";
import type { ScanResult } from "@deploysense/scanner-core";

export function scanDocument(document: vscode.TextDocument): ScanResult | undefined {
  const file = document.uri.fsPath.replace(/\\/g, "/").toLowerCase();
  const content = document.getText();
  if (file.endsWith("dockerfile") || file.endsWith(".dockerfile")) return scanDockerfile(content, document.uri.fsPath);
  if (file.includes(".github/workflows/")) return scanGithubActions(content, document.uri.fsPath);
  if (/docker-compose.*\.ya?ml$|compose\.ya?ml$/.test(file)) return scanCompose(content, document.uri.fsPath);
  if (/\bkind:\s*(deployment|service|pod|statefulset|daemonset)\b/i.test(content)) return scanKubernetes(content, document.uri.fsPath);
  return undefined;
}
