"use client";

import { useEffect, useRef, useState } from "react";

export function TerminalOutput({ lines }: { lines: string[] }) {
  const [visible, setVisible] = useState(1);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible >= lines.length) {
      setDone(true);
      return;
    }
    const timer = setTimeout(
      () => setVisible((c) => Math.min(lines.length, c + 1)),
      480
    );
    return () => clearTimeout(timer);
  }, [visible, lines.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visible]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-black/60 relative">
      {/* Scanline sweep effect */}
      <div className="terminal-scanline" aria-hidden="true" />

      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/70 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-4 font-mono text-xs text-zinc-500">deploysense — bash</span>
      </div>

      {/* Output lines */}
      <div className="min-h-[200px] p-5 font-mono text-sm leading-7">
        {lines.slice(0, visible).map((line, index) => {
          const isCommand = line.startsWith("$");
          const isScore   = line.toLowerCase().includes("score");
          const isIssue   = line.toLowerCase().includes("issue") || line.toLowerCase().includes("fix");
          const isArch    = line.toLowerCase().includes("arch") || line.toLowerCase().includes("node");

          return (
            <div
              key={index}
              className={
                isCommand ? "text-cyan-300"
                : isScore ? "text-emerald-300"
                : isIssue ? "text-yellow-200"
                : isArch  ? "text-violet-300"
                : "text-zinc-400"
              }
            >
              {line}
            </div>
          );
        })}

        {/* Animated block cursor */}
        {!done ? (
          <span className="cursor-blink" aria-hidden="true" />
        ) : (
          <span className="text-zinc-600">
            █{" "}<span className="cursor-blink">_</span>
          </span>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
