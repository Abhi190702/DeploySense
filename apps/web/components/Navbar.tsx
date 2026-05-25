import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-mono text-lg font-bold text-cyan-300">DeploySense</Link>
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <Link href="/scan" className="hover:text-cyan-300">Scan</Link>
          <Link href="/rules" className="hover:text-cyan-300">Rules</Link>
          <Link href="/docs" className="hover:text-cyan-300">Docs</Link>
          <Link href="/contribute" className="hidden hover:text-cyan-300 sm:inline">Contribute</Link>
        </div>
      </nav>
    </header>
  );
}
