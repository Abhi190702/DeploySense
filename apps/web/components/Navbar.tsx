"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-base font-bold tracking-tight text-zinc-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400 text-xs font-black text-zinc-950">
            DS
          </span>
          <span className="group-hover:text-cyan-300 transition-colors duration-150">
            DeploySense
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          {[
            { href: "/scan",       label: "Scanner" },
            { href: "/rules",      label: "Rules" },
            { href: "/docs",       label: "Docs" },
            { href: "/contribute", label: "Contribute", hidden: true },
          ].map(({ href, label, hidden }) => (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-1.5 font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${hidden ? "hidden sm:inline-flex" : "inline-flex"}`}
            >
              {label}
            </Link>
          ))}

          {/* GitHub star CTA */}
          <a
            href="https://github.com/Abhi190702/DeploySense"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star DeploySense on GitHub"
            className="ml-2 flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:border-cyan-400/50 hover:bg-zinc-800 hover:text-cyan-300"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star
          </a>
        </div>
      </nav>
    </header>
  );
}
