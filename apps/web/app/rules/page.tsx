"use client";

import { useEffect, useMemo, useState } from "react";
import { RuleCard } from "@/components/RuleCard";
import { getRules } from "@/lib/api";

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [scanner, setScanner] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [autoFixable, setAutoFixable] = useState(false);

  useEffect(() => { getRules().then(setRules).catch(() => setRules([])); }, []);
  const filtered = useMemo(() => rules.filter((rule) => {
    if (scanner !== "all" && rule.scanner !== scanner) return false;
    if (severity !== "all" && rule.severity !== severity) return false;
    if (category !== "all" && rule.category !== category) return false;
    if (autoFixable && !rule.autoFixable) return false;
    if (search && !`${rule.id} ${rule.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [autoFixable, category, rules, scanner, search, severity]);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black">Rules Explorer</h1>
            <p className="mt-2 text-zinc-400">Search and filter DeploySense rules across Docker, GitHub Actions, Kubernetes, and Compose.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">Total rules: {rules.length || 46}</div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <input className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="Search rules" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select label="Scanner" value={scanner} setValue={setScanner} values={["all", "dockerfile", "github-actions", "kubernetes", "compose"]} />
            <Select label="Severity" value={severity} setValue={setSeverity} values={["all", "critical", "high", "medium", "low", "info"]} />
            <Select label="Category" value={category} setValue={setCategory} values={["all", "security", "reliability", "performance", "cost", "maintainability", "cicd_quality"]} />
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={autoFixable} onChange={(e) => setAutoFixable(e.target.checked)} /> Auto-fixable only</label>
          </aside>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((rule) => <RuleCard key={rule.id} rule={rule} />)}
          </section>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, setValue, values }: { label: string; value: string; setValue: (value: string) => void; values: string[] }) {
  return (
    <label className="block text-sm text-zinc-400">
      {label}
      <select className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" value={value} onChange={(e) => setValue(e.target.value)}>
        {values.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
}
