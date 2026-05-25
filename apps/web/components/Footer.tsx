import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-8 text-sm text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p><span className="font-mono text-cyan-300">DeploySense</span> - open-source DevOps intelligence.</p>
        <div className="flex gap-4">
          <Link href="/docs">Docs</Link>
          <Link href="/rules">Rules</Link>
          <a href="https://github.com/Abhi190702/DeploySense">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
