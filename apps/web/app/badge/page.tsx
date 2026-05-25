"use client";

import { useMemo, useState } from "react";

export default function BadgePage() {
  const [repo, setRepo] = useState("Abhi190702/DeploySense");
  const markdown = useMemo(() => `![DeploySense](https://img.shields.io/badge/DeploySense-Configured-22d3ee)`, []);
  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">Badge Generator</h1>
        <p className="mt-2 text-zinc-400">Show that your repo is protected by DeploySense scans.</p>
        <input className="mt-6 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2" value={repo} onChange={(e) => setRepo(e.target.value)} />
        <div className="mt-6 rounded border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm">{markdown}</div>
        <button className="mt-4 rounded bg-cyan-400 px-4 py-2 font-semibold text-zinc-950" onClick={() => navigator.clipboard.writeText(markdown)}>Copy Markdown</button>
      </div>
    </div>
  );
}
