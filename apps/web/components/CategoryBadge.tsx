import type { RiskCategory } from "@deploysense/scanner-core";

export function CategoryBadge({ category }: { category: RiskCategory }) {
  return <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">{category.replace("_", " ")}</span>;
}
