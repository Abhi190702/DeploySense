"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { ScanResult, ScannerTool } from "@deploysense/scanner-core";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ReportTabs } from "@/components/ReportTabs";
import { ScannerSelector } from "@/components/ScannerSelector";
import { UploadDropzone } from "@/components/UploadDropzone";
import { doctorLogs, scanWithType } from "@/lib/api";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="h-[420px] rounded-lg border border-zinc-800 bg-zinc-900 p-4">Loading editor...</div> });

const examples = {
  "Broken Node Dockerfile": {
    fileName: "Dockerfile",
    content: "FROM node:latest\nENV API_KEY=secret\nCOPY . .\nRUN npm install\nRUN npm run build\nRUN npm prune --production\nCMD [\"npm\", \"start\"]\n"
  },
  "Broken GitHub Actions": {
    fileName: ".github/workflows/ci.yml",
    content: "name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/setup-node@v3\n      - run: npm install\n      - run: npm run build\n"
  },
  "Broken Kubernetes Deployment": {
    fileName: "deployment.yaml",
    content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: api\n          image: api:latest\n"
  },
  "Broken Docker Compose": {
    fileName: "docker-compose.yml",
    content: "services:\n  db:\n    image: postgres:latest\n    ports:\n      - \"5432:5432\"\n    environment:\n      POSTGRES_PASSWORD: secret\n"
  }
};

export default function ScanPage() {
  const [fileName, setFileName] = useState("Dockerfile");
  const [content, setContent] = useState(examples["Broken Node Dockerfile"].content);
  const [scanner, setScanner] = useState<ScannerTool | "auto">("auto");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"config" | "logs">("config");
  const [logResult, setLogResult] = useState<any>(null);

  const language = useMemo(() => fileName.endsWith(".yml") || fileName.endsWith(".yaml") ? "yaml" : "dockerfile", [fileName]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void runScan();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function runScan() {
    setLoading(true);
    setError("");
    try {
      if (mode === "logs") {
        setLogResult(await doctorLogs(content, fileName));
        setResult(null);
      } else {
        const scan = await scanWithType(scanner, content, fileName);
        setResult(scan);
        setLogResult(null);
        const history = JSON.parse(localStorage.getItem("deploysense:recent") ?? "[]");
        localStorage.setItem("deploysense:recent", JSON.stringify([{ fileName, score: scan.score, at: Date.now() }, ...history].slice(0, 5)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr_320px]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-semibold">Files</h2>
            <div className="mt-4">
              <UploadDropzone onFile={(name, text) => { setFileName(name); setContent(text); }} />
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase text-zinc-500">Try an example</p>
              {Object.entries(examples).map(([label, example]) => (
                <button key={label} className="block w-full rounded border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-300 hover:border-cyan-400" onClick={() => { setFileName(example.fileName); setContent(example.content); setMode("config"); }}>
                  {label}
                </button>
              ))}
              <button className="block w-full rounded border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-300 hover:border-cyan-400" onClick={() => { setFileName("deploy.log"); setContent("ImagePullBackOff\nCrashLoopBackOff\nECONNREFUSED\n"); setMode("logs"); }}>
                Deployment log sample
              </button>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <input className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 outline-none" value={fileName} onChange={(event) => setFileName(event.target.value)} />
            <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" onClick={runScan} disabled={loading}>{loading ? <LoadingSpinner /> : "Scan Now"}</button>
          </div>
          <Monaco height="430px" language={mode === "logs" ? "text" : language} theme="vs-dark" value={content} onChange={(value) => setContent(value ?? "")} options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: "on" }} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className={`rounded px-3 py-2 text-sm ${mode === "config" ? "bg-cyan-400 text-zinc-950" : "border border-zinc-700"}`} onClick={() => setMode("config")}>Config Scanner</button>
            <button className={`rounded px-3 py-2 text-sm ${mode === "logs" ? "bg-cyan-400 text-zinc-950" : "border border-zinc-700"}`} onClick={() => setMode("logs")}>Log Doctor</button>
            <ScannerSelector value={scanner} onChange={(value) => setScanner(value as ScannerTool | "auto")} />
            <span className="text-xs text-zinc-500">Ctrl+Enter to scan</span>
          </div>
          {error ? <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          {result ? <ReportTabs result={result} /> : null}
          {logResult ? <LogReport result={logResult} /> : null}
          {!result && !logResult ? <div className="mt-8"><EmptyState title="No scan yet" body="Run a scan to see health scores, category breakdowns, and fix suggestions." /></div> : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-semibold">Scan Settings</h2>
            <p className="mt-3 text-sm text-zinc-400">Detected input is analyzed locally by the API server. Use explicit scanner mode when a YAML file could be Compose, GitHub Actions, or Kubernetes.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-semibold">Quick Tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>Pin image tags for reproducible deploys.</li>
              <li>Set resource requests and limits on every Kubernetes container.</li>
              <li>Declare minimal GitHub token permissions.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LogReport({ result }: { result: any }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold">Log Doctor</h2>
      <p className="text-zinc-400">{result.summary}</p>
      {result.findings.map((finding: any) => (
        <article key={`${finding.pattern}-${finding.lineNumber}`} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="font-semibold text-cyan-200">{finding.title}</h3>
          <p className="mt-2 text-sm text-zinc-400">Line {finding.lineNumber}: {finding.matchedLine}</p>
          <p className="mt-3 text-sm text-zinc-300">Causes: {finding.causes.join(", ")}</p>
          <p className="mt-2 text-sm text-zinc-300">Debug: {finding.debugCommands.join(" | ")}</p>
        </article>
      ))}
    </section>
  );
}
