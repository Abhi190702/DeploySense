"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 border-b transition-all duration-200"
      style={{
        borderColor: scrolled ? "rgba(39,39,42,0.8)" : "rgba(39,39,42,0.4)",
        background: scrolled
          ? "rgba(9,9,11,0.90)"
          : "rgba(9,9,11,0.50)",
        backdropFilter: scrolled ? "blur(12px)" : "blur(4px)",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-bold tracking-tight text-zinc-100 select-none"
        >
          {/* Brand mark — hexagon + heartbeat */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0 transition-transform duration-200 group-hover:scale-105"
          >
            <rect width="32" height="32" rx="7" fill="#09090b"/>
            <polygon
              points="16,2 28,8.5 28,23.5 16,30 4,23.5 4,8.5"
              stroke="#22d3ee"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <polygon
              points="16,4.5 26,10.25 26,21.75 16,27.5 6,21.75 6,10.25"
              fill="#0d1117"
              opacity="0.7"
            />
            <polyline
              points="4.5,16 9,16 10.5,11 12,21 13.5,13 15,19 16.5,16 23,16 27.5,16"
              stroke="#22d3ee"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="13.5" cy="13" r="1.2" fill="#22d3ee" opacity="0.9"/>
          </svg>

          <span className="text-base font-bold">
            <span className="text-white">Deploy</span>
            <span className="text-cyan-400">Sense</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          {[
            { href: "/scan",       label: "Scanner" },
            { href: "/rules",      label: "Rules"   },
            { href: "/docs",       label: "Docs"    },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex rounded px-3 py-1.5 font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              {label}
            </Link>
          ))}

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
