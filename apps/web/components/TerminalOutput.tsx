"use client";

import { useEffect, useState } from "react";

export function TerminalOutput({ lines }: { lines: string[] }) {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setVisible((count) => Math.min(lines.length, count + 1)), 450);
    return () => clearInterval(timer);
  }, [lines.length]);
  return (
    <div className="rounded-lg border border-zinc-800 bg-black p-4 font-mono text-sm shadow-2xl">
      <div className="mb-3 flex gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="h-3 w-3 rounded-full bg-emerald-500" />
      </div>
      {lines.slice(0, visible).map((line) => (
        <div key={line} className={line.startsWith("$") ? "text-cyan-300" : "text-zinc-300"}>{line}</div>
      ))}
    </div>
  );
}
