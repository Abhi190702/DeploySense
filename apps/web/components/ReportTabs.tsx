"use client";

import { useMemo, useState } from "react";
import type { Issue, ScanResult, Severity } from "@deploysense/scanner-core";
import { CategoryChart } from "./CategoryChart";
import { EmptyState } from "./EmptyState";
import { GradeDisplay } from "./GradeDisplay";
import { IssueCard } from "./IssueCard";
import { ScoreRing } from "./ScoreRing";

const tabs = ["Overview", "Issues", "Fixes", "Security", "Raw JSON", "Markdown"];
const severities: (Severity | "all")[] = ["all", "critical", "high", "medium", "low", "info"];

export function ReportTabs({ result }: { result: ScanResult }) {
  const [tab, setTab] = useState("Overview");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [query, setQuery] = useState("");
  const issues = useMemo(() => {
    return result.issues.filter((issue) => {
      if (tab === "Fixes" && !issue.autoFixable) return false;
      if (tab === "Security" && issue.category !== "security") return false;
      if (severity !== "all" && issue.severity !== severity) return false;
      if (query && !`${issue.id} ${issue.title} ${issue.fix}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, result.issues, severity, tab]);

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <ScoreRing score={result.score} />
          <div className="mt-4 flex items-end gap-4">
            <GradeDisplay grade={result.grade} />
            <div className="pb-2 text-sm text-zinc-400">{result.status.replace("_", " ")}</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Summary label="Total Issues" value={result.summary.total} />
          <Summary label="Critical" value={result.summary.critical} tone="text-red-300" />
          <Summary label="High" value={result.summary.high} tone="text-orange-300" />
          <Summary label="Medium" value={result.summary.medium} tone="text-yellow-200" />
        </div>
      </div>
      <CategoryChart scores={result.categoryScores} />
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item} className={`rounded px-3 py-2 text-sm ${tab === item ? "bg-cyan-400 text-zinc-950" : "border border-zinc-700 text-zinc-300"}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Raw JSON" ? <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
      {tab === "Markdown" ? <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs">{toMarkdownLite(result)}</pre> : null}
      {["Overview", "Issues", "Fixes", "Security"].includes(tab) ? (
        <div className="space-y-4">
          {tab !== "Overview" ? (
            <div className="flex flex-wrap gap-2">
              <input className="min-w-64 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="Search issues" value={query} onChange={(event) => setQuery(event.target.value)} />
              {severities.map((item) => (
                <button key={item} className={`rounded border px-3 py-2 text-sm ${severity === item ? "border-cyan-400 text-cyan-200" : "border-zinc-700 text-zinc-300"}`} onClick={() => setSeverity(item)}>{item}</button>
              ))}
            </div>
          ) : null}
          {(tab === "Overview" ? result.issues.slice(0, 3) : issues).map((issue: Issue) => <IssueCard key={`${issue.id}-${issue.line}-${issue.message}`} issue={issue} />)}
          {(tab === "Overview" ? result.issues.slice(0, 3) : issues).length === 0 ? <EmptyState title="Nothing to show" body="No issues match this view." /> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-5">
        <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" onClick={() => navigator.clipboard.writeText(toMarkdownLite(result))}>Copy Markdown Report</button>
        <button className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-100" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>Download JSON Report</button>
        <button className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-100" onClick={() => navigator.clipboard.writeText(toGithubComment(result))}>Copy GitHub Comment</button>
      </div>
    </section>
  );
}

function Summary({ label, value, tone = "text-zinc-100" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className={`text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function toMarkdownLite(result: ScanResult) {
  return `## DeploySense Report\n\nScore: ${result.score}/100 (${result.grade})\n\n${result.issues.map((issue) => `- [${issue.severity}] ${issue.id}: ${issue.fix}`).join("\n")}`;
}

function toGithubComment(result: ScanResult) {
  return `## DeploySense Report\n\n**Score:** ${result.score}/100 · Grade **${result.grade}**\n\n| Severity | Rule | Fix |\n|---|---|---|\n${result.issues.map((issue) => `| ${issue.severity} | ${issue.id} | ${issue.fix.replace(/\|/g, "\\|")} |`).join("\n")}`;
}
