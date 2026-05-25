import Link from "next/link";
import { GitHubStarButton } from "@/components/GitHubStarButton";
import { TerminalOutput } from "@/components/TerminalOutput";

const terminalLines = [
  "$ deploysense scan .",
  "Scanning Dockerfile, compose, Kubernetes, GitHub Actions...",
  "Overall score: 76/100 [B]",
  "Top issue: K8S_NO_RESOURCE_LIMITS",
  "Fix: add CPU and memory limits before production"
];

export default function HomePage() {
  return (
    <div className="terminal-grid">
      <section className="mx-auto grid min-h-[86vh] max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-sm text-cyan-300">Open-source DevOps intelligence</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-normal text-zinc-50 sm:text-7xl">Fix deployments before they break production.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            DeploySense scans your Docker, Kubernetes, GitHub Actions, and Compose configs. Get health scores, risk analysis, and exact fixes before your users see the error.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/scan" className="rounded bg-cyan-400 px-5 py-3 font-semibold text-zinc-950">Try Live Scanner</Link>
            <a href="https://github.com/Abhi190702/DeploySense" className="rounded border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 hover:border-cyan-400">View on GitHub</a>
          </div>
          <p className="mt-5 text-sm text-zinc-500">Used by 500+ developers · Open Source · Free Forever</p>
        </div>
        <TerminalOutput lines={terminalLines} />
      </section>

      <section className="border-y border-zinc-800 bg-zinc-950/80 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Deployment errors cost hours. DeploySense costs seconds.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["3 AM Docker failures", "Catch root users, floating tags, bad cache order, missing health checks."],
              ["CI that randomly fails", "Spot missing checkout, no cache, no tests, broad permissions, and unpinned actions."],
              ["Kubernetes mysteries", "Find missing probes, limits, requests, labels, namespaces, and bad service ports."]
            ].map(([title, body]) => (
              <article key={title} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="font-semibold text-cyan-200">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">How it works</h2>
            <div className="mt-6 space-y-4">
              {["Paste or upload your config file.", "DeploySense runs 46+ rules across deployment surfaces.", "Get scores, risk categories, explanations, and safe fixes."].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-cyan-400 font-bold text-zinc-950">{index + 1}</span>
                  <p className="text-zinc-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-2xl font-bold">Supported scanners</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Dockerfile · 12 rules", "GitHub Actions · 12 rules", "Kubernetes · 12 rules", "Docker Compose · 10 rules"].map((item) => (
                <div key={item} className="rounded border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-cyan-200">{item}</div>
              ))}
            </div>
            <div className="mt-6">
              <GitHubStarButton />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
