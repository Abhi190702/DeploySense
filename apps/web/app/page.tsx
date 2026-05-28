"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Container,
  Cpu,
  FileCode2,
  GitBranch,
  GitMerge,
  Network,
  ShieldCheck,
} from "lucide-react";
import { GitHubStarButton } from "@/components/GitHubStarButton";
import { TerminalOutput } from "@/components/TerminalOutput";

const terminalLines = [
  "$ deploysense scan .",
  "Scanning Dockerfile, Compose, Kubernetes, GitHub Actions...",
  "Architecture: 9 nodes, 11 links, 3 insights",
  "Overall score: 76/100 [B]",
  "Top issue: ARCH_MUTABLE_IMAGE_CHAIN",
  "Fix: pin images across CI, Docker, and runtime manifests",
];

const problems = [
  {
    icon: AlertTriangle,
    title: "3 AM Docker failures",
    body: "Catch root users, floating tags, bad cache order, and missing health checks before they wake you up.",
    accent: "text-red-400",
    border: "hover:border-red-400/35",
  },
  {
    icon: GitBranch,
    title: "CI that randomly fails",
    body: "Spot missing checkout steps, no dependency cache, broad permissions, and unpinned actions in seconds.",
    accent: "text-yellow-400",
    border: "hover:border-yellow-400/35",
  },
  {
    icon: Network,
    title: "Architecture drift",
    body: "Connect CI pipelines, Dockerfiles, image builds, Kubernetes workloads, services, and Compose dependencies.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-400/35",
  },
];

const steps = [
  { number: 1, title: "Paste or upload", body: "Drop a Dockerfile, workflow YAML, Kubernetes manifest, or deployment log." },
  { number: 2, title: "54+ rules run instantly", body: "DeploySense runs tokenized analysis and builds a cross-file architecture graph." },
  { number: 3, title: "Get scores + exact fixes", body: "See health scores, risk categories, cross-file insights, and copy-paste fixes." },
];

const scanners = [
  { icon: Container,  label: "Dockerfile",       rules: 20  },
  { icon: GitMerge,   label: "GitHub Actions",   rules: 12  },
  { icon: Cpu,        label: "Kubernetes",        rules: 12  },
  { icon: FileCode2,  label: "Docker Compose",   rules: 10  },
];

/* ── Tilt card hook ──────────────────────────────────────────── */
function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      el!.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    }
    function onLeave() {
      el!.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

/* ── Counter animation hook ─────────────────────────────────── */
function useCounterAnimation(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const counters = el.querySelectorAll<HTMLElement>("[data-target]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          counters.forEach((counter) => {
            const target = parseInt(counter.dataset.target ?? "0", 10);
            const duration = 1200;
            const startTime = performance.now();

            function tick(now: number) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // easeOutExpo
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              counter.textContent = String(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
          observer.disconnect();
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);
}

/* ── Feature cards scroll-in hook ───────────────────────────── */
function useCardsAnimation(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>(".feature-card-animate");

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();

        const { animate, stagger } = await import("animejs");
        animate(cards, {
          opacity:   [0, 1],
          translateY: [30, 0],
          delay: stagger(100),
          duration: 500,
          easing: "easeOutQuart",
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);
}

/* ── Hero word animation hook ────────────────────────────────── */
function useHeroAnimation(heroRef: React.RefObject<HTMLElement | null>, terminalRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { animate, stagger } = await import("animejs");
      if (cancelled) return;

      const words = heroRef.current?.querySelectorAll<HTMLElement>(".hero-word");
      if (words?.length) {
        animate(words, {
          opacity:    [0, 1],
          translateY: [20, 0],
          delay: stagger(80),
          duration: 600,
          easing: "easeOutQuart",
        });
      }

      if (terminalRef.current) {
        animate(terminalRef.current, {
          opacity:    [0, 1],
          translateX: [40, 0],
          delay: 300,
          duration: 700,
          easing: "easeOutQuart",
        });
      }
    })();
    return () => { cancelled = true; };
  }, [heroRef, terminalRef]);
}

/* ── TiltCard component ─────────────────────────────────────── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return (
    <div
      ref={ref}
      className={`tilt-card transition-transform duration-300 ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function HomePage() {
  const heroTextRef    = useRef<HTMLDivElement>(null);
  const terminalRef    = useRef<HTMLDivElement>(null);
  const scannerGridRef = useRef<HTMLDivElement>(null);
  const cardsRef       = useRef<HTMLDivElement>(null);

  useHeroAnimation(heroTextRef, terminalRef);
  useCounterAnimation(scannerGridRef);
  useCardsAnimation(cardsRef);

  // Split headline into individually-animatable word spans
  const headline = "Fix deployments before they break production.";
  const words = headline.split(" ");

  return (
    <div className="page-enter">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero-grid mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-4 py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div ref={heroTextRef}>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <p className="font-mono text-xs text-cyan-300 tracking-wide">
              Open-source DevOps intelligence
            </p>
          </div>

          {/* Animated headline */}
          <h1 className="mt-5 max-w-2xl text-5xl font-black tracking-tight text-zinc-50 sm:text-6xl xl:text-7xl leading-[1.1]">
            {words.map((word, i) => (
              <span key={i} className="hero-word mr-[0.25em]">
                {word === "before" ? (
                  <span className="bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : word}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            DeploySense scans your Docker, Kubernetes, GitHub Actions, and Compose configs.
            Get health scores, risk analysis, and exact fixes — before your users see the error.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/scan"
              id="cta-try-scanner"
              className="btn-primary rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-zinc-950 shadow-lg"
            >
              Try Live Scanner
            </Link>
            <a
              href="https://github.com/Abhi190702/DeploySense"
              id="cta-github"
              className="btn-secondary flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 hover:border-zinc-400 hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </a>
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Open source · MIT · CLI + Web + API · Built for contributor-friendly DevOps analysis
          </p>
        </div>

        {/* Terminal */}
        <div ref={terminalRef} style={{ opacity: 0 }}>
          <TerminalOutput lines={terminalLines} />
        </div>
      </section>

      {/* ── Problem Bento Cards ──────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-950/80 px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">What DeploySense catches</p>
          <h2 className="mt-3 text-3xl font-bold text-zinc-50">
            Deployment errors cost hours.{" "}
            <span className="text-zinc-400">DeploySense costs seconds.</span>
          </h2>

          <div ref={cardsRef} className="mt-10 grid gap-5 md:grid-cols-3 tilt-container">
            {problems.map(({ icon: Icon, title, body, accent, border }) => (
              <TiltCard key={title}>
                <article
                  className={`feature-card-animate card-glow rounded-xl border border-zinc-800 bg-zinc-900 p-6 ${border}`}
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-zinc-100">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
                </article>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works + Scanners ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Visual stepper */}
          <div>
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Three steps</p>
            <h2 className="mt-3 text-3xl font-bold text-zinc-50">How it works</h2>
            <div className="mt-8 space-y-0">
              {steps.map(({ number, title, body }, index) => (
                <div
                  key={title}
                  className={`relative flex gap-5 pb-8 ${index < steps.length - 1 ? "step-connector" : ""}`}
                >
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-sm text-zinc-950 shadow-lg shadow-cyan-900/30">
                    {number}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-semibold text-zinc-100">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-zinc-800 bg-black p-4">
              <p className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-wide">Quick start</p>
              <code className="block font-mono text-sm text-cyan-300">npx deploysense scan .</code>
              <code className="block font-mono text-sm text-zinc-500 mt-1"># Or paste a file in the Live Scanner →</code>
            </div>
          </div>

          {/* Scanners grid with counter animation */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-50">Supported scanners</h2>
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-mono text-cyan-300 border border-cyan-400/20">
                54+ rules
              </span>
            </div>

            <div ref={scannerGridRef} className="mt-6 grid gap-3 sm:grid-cols-2">
              {scanners.map(({ icon: Icon, label, rules }) => (
                <TiltCard key={label}>
                  <div className="card-glow flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-cyan-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{label}</p>
                      <p className="text-xs font-mono text-zinc-500">
                        <span data-target={String(rules)}>0</span> rules
                      </p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Architecture graph included
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Project scans identify weak links across pipelines, image builds, runtime manifests, services, and secret boundaries.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <GitHubStarButton />
              <Link href="/rules" className="text-sm text-zinc-400 hover:text-cyan-300 transition-colors">
                View all rules →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="border-t border-zinc-800 bg-zinc-950 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            {[
              { value: "54+",   label: "Security & reliability rules" },
              { value: "4",     label: "Scanner types" },
              { value: "100%",  label: "Open source (MIT)" },
              { value: "0 ms",  label: "No account needed" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-black text-cyan-400">{value}</p>
                <p className="mt-1 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
