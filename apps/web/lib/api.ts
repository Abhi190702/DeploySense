import type { ProjectReport, ScanResult, ScannerTool } from "@deploysense/scanner-core";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json()).error?.message ?? "API request failed");
  return res.json() as Promise<T>;
}

export function scanAuto(content: string, fileName: string) {
  return post<ScanResult>("/api/scan/auto", { content, fileName });
}

export function scanDockerfile(content: string, fileName = "Dockerfile") {
  return post<ScanResult>("/api/scan/dockerfile", { content, fileName });
}

export function scanGithubActions(content: string, fileName = ".github/workflows/ci.yml") {
  return post<ScanResult>("/api/scan/github-actions", { content, fileName });
}

export function scanKubernetes(content: string, fileName = "deployment.yaml") {
  return post<ScanResult>("/api/scan/kubernetes", { content, fileName });
}

export function scanCompose(content: string, fileName = "docker-compose.yml") {
  return post<ScanResult>("/api/scan/compose", { content, fileName });
}

export function scanProject(files: Array<{ name: string; content: string }>) {
  return post<ProjectReport>("/api/scan/project", { files });
}

export function doctorLogs(content: string, fileName = "deploy.log") {
  return post("/api/doctor/logs", { content, fileName });
}

export function scanWithType(type: ScannerTool | "auto", content: string, fileName: string) {
  if (type === "dockerfile") return scanDockerfile(content, fileName);
  if (type === "github-actions") return scanGithubActions(content, fileName);
  if (type === "kubernetes") return scanKubernetes(content, fileName);
  if (type === "compose") return scanCompose(content, fileName);
  return scanAuto(content, fileName);
}

export async function getRules() {
  const res = await fetch(`${API_URL}/api/rules`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getScan(scanId: string) {
  const res = await fetch(`${API_URL}/api/scans/${scanId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Scan not found");
  return res.json() as Promise<ScanResult>;
}

export async function getShare(token: string) {
  const res = await fetch(`${API_URL}/api/share/${token}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Shared report not found");
  return res.json() as Promise<ScanResult>;
}
