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
      () => setVisible((count) => Math.min(lines.length, count + 1)),
      480
    );
    return () => clearTimeout(timer);
  }, [visible, lines.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visible]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-black/60">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500 opacity-80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500 opacity-80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500 opacity-80" />
        <span className="ml-4 font-mono text-xs text-zinc-500">
          deploysense — bash
        </span>
      </div>

      {/* Output */}
      <div className="min-h-[160px] p-5 font-mono text-sm leading-7">
        {lines.slice(0, visible).map((line, index) => {
          const isCommand = line.startsWith("$");
          const isScore   = line.toLowerCase().includes("score");
          const isIssue   = line.toLowerCase().includes("issue") || line.toLowerCase().includes("fix");

          return (
            <div
              key={index}
              className={
                isCommand
                  ? "text-cyan-300"
                  : isScore
                  ? "text-emerald-300"
                  : isIssue
                  ? "text-yellow-200"
                  : "text-zinc-400"
              }
            >
              {line}
            </div>
          );
        })}

        {/* Blinking cursor */}
        {!done ? (
          <span className="inline-block h-4 w-2 bg-cyan-400 cursor-blink align-text-bottom" />
        ) : (
          <span className="mt-1 inline-block text-zinc-600">
            █ <span className="cursor-blink">_</span>
          </span>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
