export function CodeBlock({ children }: { children: string }) {
  return <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-200">{children}</pre>;
}
