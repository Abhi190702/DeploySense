import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-10 text-sm text-zinc-500">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-mono font-bold text-zinc-200">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan-400 text-xs font-black text-zinc-950">
                DS
              </span>
              DeploySense
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Open-source DevOps intelligence. Catch deployment issues before
              they reach production.
            </p>
            <p className="mt-3 text-xs text-zinc-600">
              MIT License · Built in public
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/scan",       label: "Live Scanner" },
                { href: "/rules",      label: "Rule Library" },
                { href: "/docs",       label: "Documentation" },
                { href: "/contribute", label: "Contribute" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* OpenSSF + GitHub */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Security
            </p>
            <div className="mt-3 space-y-3">
              <a
                href="https://github.com/Abhi190702/DeploySense"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://bestpractices.coreinfrastructure.org/projects/10963"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <ShieldIcon />
                OpenSSF Best Practices
              </a>
              <a
                href="https://github.com/Abhi190702/DeploySense/security/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <LockIcon />
                Security Policy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-800 pt-6 text-xs text-zinc-600 text-center">
          © {new Date().getFullYear()} DeploySense. Open source under the MIT License.
        </div>
      </div>
    </footer>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden="true">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.5C17.25 22.15 21 17.25 21 12V7L12 2zm-1 13.5l-3-3 1.41-1.41L11 12.67l4.59-4.58L17 9.5l-6 6z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden="true">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}
