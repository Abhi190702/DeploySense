import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import boxen from "boxen";
import chalk from "chalk";

/* ── Persistent state ─────────────────────────────────────────── */

const STATE_DIR  = path.join(os.homedir(), ".deploysense");
const STATE_FILE = path.join(STATE_DIR, "state.json");

/* ── Polished ASCII art ───────────────────────────────────────── */
//  Two-tone: cyan hex-border mark + white wordmark, compact and clean

const MARK = chalk.cyan(`
  ██████╗ ███████╗
  ██╔══██╗██╔════╝
  ██║  ██║███████╗
  ██║  ██║╚════██║
  ██████╔╝███████║
  ╚═════╝ ╚══════╝`);

const WORDMARK = chalk.white.bold(`
 ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗
 ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝
 ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝
 ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝
 ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║
 ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝`) +
chalk.cyan.bold(`
  ███████╗███████╗███╗   ██╗███████╗███████╗
  ██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝
  ███████╗█████╗  ██╔██╗ ██║███████╗█████╗
  ╚════██║██╔══╝  ██║╚██╗██║╚════██║██╔══╝
  ███████║███████╗██║ ╚████║███████║███████╗
  ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝`);

const TAGLINE = boxen(
  [
    chalk.bold.white("Fix deployments before they break production."),
    "",
    `  ${chalk.cyan("⬡")}  ${chalk.cyan("scan")}          Dockerfile · Kubernetes · GitHub Actions · Compose`,
    `  ${chalk.cyan("⬡")}  ${chalk.cyan("doctor")}        Diagnose deployment logs in seconds`,
    `  ${chalk.cyan("⬡")}  ${chalk.cyan("list-rules")}    Explore all deployment safety rules`,
    `  ${chalk.cyan("⬡")}  ${chalk.cyan("fix")}           Apply safe auto-fixes to a config`,
    "",
    chalk.gray("  Quick start: deploysense scan ."),
    chalk.gray("  Docs:        https://github.com/Abhi190702/DeploySense"),
  ].join("\n"),
  {
    padding:     { top: 1, bottom: 1, left: 2, right: 2 },
    margin:      { top: 0, bottom: 1, left: 1, right: 1 },
    borderStyle: "round",
    borderColor: "cyan",
    dimBorder:   false,
  }
);

/* ── Public API ───────────────────────────────────────────────── */

/** Full splash — shown only on first ever run. */
export function showSplash(): void {
  console.log(WORDMARK);
  console.log(TAGLINE);
}

/** Compact one-liner shown before normal scans. */
export function showSmallHeader(): void {
  process.stdout.write(
    chalk.cyan("⬡ ") +
    chalk.white.bold("DeploySense") +
    "  " +
    chalk.gray("Fix deployments before they break production.") +
    "\n\n"
  );
}

/**
 * Shows the full splash once (on the very first CLI run),
 * then never again. Safe to call on every run.
 */
export function maybeShowFirstRunSplash(args: string[]): void {
  if (shouldSkipBanner(args)) return;
  if (hasSeenSplash()) return;

  showSplash();
  markSplashSeen();
}

/**
 * Returns true when any machine/format flag is present that
 * makes a decorative banner inappropriate.
 */
export function shouldSkipBanner(args: string[]): boolean {
  return (
    process.env["CI"] === "true"                    ||
    process.env["CI"] === "1"                       ||
    process.env["DEPLOYSENSE_NO_BANNER"] === "1"    ||
    args.includes("--no-banner")                    ||
    args.includes("--json")                         ||
    args.includes("--sarif")                        ||
    args.includes("--markdown")                     ||
    args.includes("--quiet")
  );
}

/* ── Internal helpers ─────────────────────────────────────────── */

interface SplashState {
  hasSeenSplash?: boolean;
  firstSeenAt?:  string;
}

function hasSeenSplash(): boolean {
  try {
    if (!fs.existsSync(STATE_FILE)) return false;
    const raw   = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(raw) as SplashState;
    return state.hasSeenSplash === true;
  } catch {
    return false;
  }
}

function markSplashSeen(): void {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const state: SplashState = {
      hasSeenSplash: true,
      firstSeenAt:  new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {
    // Never crash the CLI because state couldn't be written.
  }
}
