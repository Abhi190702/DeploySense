"use client";

import type { ProjectReport } from "@deploysense/scanner-core";
import { ArchitecturePanel } from "./ArchitecturePanel";
import { GradeDisplay } from "./GradeDisplay";

export function ProjectReportView({ report }: { report: ProjectReport }) {
  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="text-sm uppercase tracking-wide text-zinc-500">Project Score</div>
          <div className="mt-3 text-5xl font-black text-zinc-50">{report.overallScore}</div>
          <div className="mt-2 flex items-end gap-3">
            <GradeDisplay grade={report.overallGrade} />
            <span className="pb-2 text-sm text-zinc-400">overall grade</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Summary label="Files scanned" value={report.scanResults.length} />
          <Summary label="Total issues" value={report.totalIssues} />
          <Summary label="Architecture insights" value={report.architecture?.insights.length ?? 0} />
        </div>
      </div>

      <ArchitecturePanel graph={report.architecture} />

      {report.topIssues.length ? (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="font-semibold">Highest Priority Fixes</h3>
          <div className="mt-4 grid gap-2">
            {report.topIssues.slice(0, 5).map((issue) => (
              <div key={`${issue.file}-${issue.id}-${issue.line ?? "file"}`} className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-cyan-200">{issue.id}</span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-300">{issue.severity}</span>
                  <span className="text-zinc-500">{issue.file}{issue.line ? `:${issue.line}` : ""}</span>
                </div>
                <p className="mt-2 text-zinc-300">{issue.fix}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="font-semibold">Scanned Files</h3>
        <div className="mt-4 space-y-2">
          {report.scanResults.map((result) => (
            <div key={result.file} className="grid gap-2 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 sm:grid-cols-[1fr_100px_90px]">
              <span className="font-mono text-zinc-400">{result.file}</span>
              <span>{result.score}/100</span>
              <span>{result.summary.total} issues</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-3xl font-bold text-zinc-100">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </div>
  );
}
