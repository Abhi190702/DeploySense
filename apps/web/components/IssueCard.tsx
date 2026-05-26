"use client";

import { useState } from "react";
import type { Issue } from "@deploysense/scanner-core";
import { CategoryBadge } from "./CategoryBadge";
import { DiffPreview } from "./DiffPreview";
import { SeverityBadge } from "./SeverityBadge";

export function IssueCard({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={issue.severity} />
        <code className="rounded bg-zinc-950 px-2 py-1 text-xs text-cyan-200">{issue.id}</code>
        <CategoryBadge category={issue.category} />
        {issue.autoFixable ? <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">auto-fixable</span> : null}
        {typeof issue.confidence === "number" ? <MetaBadge label={`${Math.round(issue.confidence * 100)}% confidence`} /> : null}
        {issue.fixFeasibility ? <MetaBadge label={`fix: ${issue.fixFeasibility}`} /> : null}
        {issue.falsePositiveRisk ? <MetaBadge label={`FP risk: ${issue.falsePositiveRisk}`} /> : null}
      </div>
      <h3 className="mt-3 text-lg font-semibold">{issue.title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{issue.file}{issue.line ? `:${issue.line}` : ""}</p>
      <p className="mt-3 text-sm text-zinc-200">{issue.message}</p>
      <button className="mt-3 text-sm text-cyan-300 focus-ring" onClick={() => setOpen(!open)}>
        {open ? "Hide details" : "Why this matters"}
      </button>
      {open ? <p className="mt-2 text-sm text-zinc-300">{issue.why}</p> : null}
      {open && issue.evidence?.length ? (
        <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Evidence</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {issue.evidence.slice(0, 4).map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="mt-4">
        <DiffPreview diff={issue.diffPreview} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-cyan-400" onClick={() => navigator.clipboard.writeText(issue.goodExample ?? issue.fix)}>
          Copy Fix
        </button>
        <a className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-cyan-400" href={`/rules?rule=${issue.id}`}>
          Learn More
        </a>
      </div>
    </article>
  );
}

function MetaBadge({ label }: { label: string }) {
  return <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-300">{label}</span>;
}
