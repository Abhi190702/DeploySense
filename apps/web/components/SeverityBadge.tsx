import clsx from "clsx";
import type { Severity } from "@deploysense/scanner-core";

const styles: Record<Severity, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
  low: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  info: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300"
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={clsx("rounded border px-2 py-0.5 text-xs font-semibold uppercase", styles[severity])}>{severity}</span>;
}
