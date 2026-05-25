import type { RuleMetadata } from "@deploysense/scanner-core";
import { CategoryBadge } from "./CategoryBadge";
import { SeverityBadge } from "./SeverityBadge";

export function RuleCard({ rule }: { rule: RuleMetadata & { scanner?: string } }) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <code className="text-sm text-cyan-200">{rule.id}</code>
      <h3 className="mt-2 font-semibold">{rule.title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <SeverityBadge severity={rule.severity} />
        <CategoryBadge category={rule.category} />
        {rule.autoFixable ? <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">auto-fixable</span> : null}
      </div>
      <p className="mt-3 text-sm text-zinc-400">{rule.scanner ?? "scanner"} rule for {rule.category.replace("_", " ")} risk.</p>
    </article>
  );
}
