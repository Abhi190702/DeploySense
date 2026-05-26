"use client";

import { Network, Route, ShieldAlert } from "lucide-react";
import type { ArchitectureGraph } from "@deploysense/scanner-core";
import { SeverityBadge } from "./SeverityBadge";

export function ArchitecturePanel({ graph }: { graph?: ArchitectureGraph }) {
  if (!graph) return null;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Pipelines" value={graph.summary.pipelines} />
        <Metric label="Images" value={graph.summary.images} />
        <Metric label="Workloads" value={graph.summary.workloads} />
        <Metric label="Services" value={graph.summary.services} />
        <Metric label="Links" value={graph.summary.linkedSystems} />
        <Metric label="Exposed" value={graph.summary.exposedEndpoints} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-300" />
            <h3 className="font-semibold">Architecture Map</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">DeploySense connects the files in this project into a lightweight deploy graph so CI, images, runtime workloads, services, and exposed paths can be reviewed together.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {graph.nodes.map((node) => (
              <div key={node.id} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-100">{node.label}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{node.file}</p>
                  </div>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] uppercase tracking-wide text-cyan-200">{node.type}</span>
                </div>
              </div>
            ))}
          </div>
          {graph.edges.length ? (
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Route className="h-4 w-4 text-violet-300" />
                Detected links
              </div>
              {graph.edges.slice(0, 8).map((edge) => (
                <p key={`${edge.from}-${edge.to}-${edge.type}-${edge.label}`} className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
                  <span className="text-zinc-200">{shortNode(edge.from)}</span>
                  <span className="px-2 text-cyan-300">{edge.label}</span>
                  <span className="text-zinc-200">{shortNode(edge.to)}</span>
                  <span className="ml-2 text-xs text-zinc-600">{Math.round(edge.confidence * 100)}%</span>
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-300" />
            <h3 className="font-semibold">Architecture Insights</h3>
          </div>
          <div className="mt-4 space-y-3">
            {graph.insights.length ? graph.insights.map((insight) => (
              <article key={insight.id} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={insight.severity} />
                  <code className="text-xs text-cyan-200">{insight.id}</code>
                </div>
                <h4 className="mt-3 font-semibold">{insight.title}</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{insight.message}</p>
                <p className="mt-3 text-sm text-zinc-200">{insight.fix}</p>
              </article>
            )) : <p className="text-sm text-zinc-400">No cross-file architecture risks detected in this project scan.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-2xl font-bold text-zinc-50">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

function shortNode(id: string): string {
  const colon = id.indexOf(":");
  const value = colon === -1 ? id : id.slice(colon + 1);
  return value.length > 34 ? `${value.slice(0, 31)}...` : value;
}
