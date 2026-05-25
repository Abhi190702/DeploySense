import type { Issue } from "./types";

export interface AppliedFix {
  ruleId: string;
  description: string;
  lineNumber?: number;
  original: string;
  replacement: string;
}

export interface SkippedFix {
  ruleId: string;
  reason: string;
}

export interface FixResult {
  original: string;
  fixed: string;
  appliedFixes: AppliedFix[];
  skippedFixes: SkippedFix[];
  success: boolean;
}

type Fixer = (content: string, issue: Issue) => { content: string; fix?: AppliedFix };

const fixers: Record<string, Fixer> = {
  DOCKER_LATEST_TAG(content, issue) {
    return replaceLine(content, issue, /:latest\b/, ":stable", "Replace latest tag with a stable tag placeholder");
  },
  DOCKER_APT_NO_CLEAN(content, issue) {
    return replaceLine(
      content,
      issue,
      /RUN (.*apt-get install.*)$/i,
      (_match, command) => `RUN ${command} && rm -rf /var/lib/apt/lists/*`,
      "Clean apt package lists after install"
    );
  },
  DOCKER_MULTIPLE_RUN_COMMANDS(content, issue) {
    const lines = content.split(/\r?\n/);
    const start = Math.max((issue.line ?? 1) - 1, 0);
    const runLines = lines.slice(start, start + 3);
    if (runLines.length < 3 || !runLines.every((line) => /^\s*RUN\s+/i.test(line))) {
      return { content };
    }
    const replacement = `RUN ${runLines.map((line) => line.replace(/^\s*RUN\s+/i, "").trim()).join(" && \\\n    ")}`;
    lines.splice(start, 3, replacement);
    return { content: lines.join("\n"), fix: applied(issue, runLines.join("\n"), replacement, "Merge consecutive RUN commands") };
  },
  GHA_NO_TIMEOUT(content, issue) {
    const lines = content.split(/\r?\n/);
    const jobLine = Math.max((issue.line ?? 1) - 1, 0);
    lines.splice(jobLine + 1, 0, "    timeout-minutes: 30");
    return { content: lines.join("\n"), fix: applied(issue, "", "timeout-minutes: 30", "Add job timeout") };
  },
  GHA_NO_CONCURRENCY(content, issue) {
    const block = "concurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true\n";
    return { content: `${block}${content}`, fix: applied(issue, "", block.trim(), "Add concurrency cancellation") };
  },
  K8S_SINGLE_REPLICA(content, issue) {
    if (/replicas:\s*1\b/.test(content)) {
      return replaceLine(content, issue, /replicas:\s*1\b/, "replicas: 2", "Increase replicas to 2");
    }
    return { content: content.replace(/(kind:\s*Deployment[\s\S]*?spec:\n)/, "$1  replicas: 2\n"), fix: applied(issue, "", "replicas: 2", "Add replicas") };
  },
  COMPOSE_NO_RESTART_POLICY(content, issue) {
    const lines = content.split(/\r?\n/);
    const line = Math.max((issue.line ?? 1) - 1, 0);
    lines.splice(line + 1, 0, "    restart: unless-stopped");
    return { content: lines.join("\n"), fix: applied(issue, "", "restart: unless-stopped", "Add restart policy") };
  }
};

export function applyFixes(content: string, issues: Issue[], ruleIds?: string[]): FixResult {
  let fixed = content;
  const appliedFixes: AppliedFix[] = [];
  const skippedFixes: SkippedFix[] = [];
  const allowed = ruleIds ? new Set(ruleIds) : undefined;

  for (const issue of issues) {
    if (allowed && !allowed.has(issue.id)) continue;
    const fixer = fixers[issue.id];
    if (!issue.autoFixable || !fixer) {
      skippedFixes.push({ ruleId: issue.id, reason: "No safe auto-fix is available" });
      continue;
    }
    const before = fixed;
    const result = fixer(fixed, issue);
    fixed = result.content;
    if (result.fix && before !== fixed) appliedFixes.push(result.fix);
    else skippedFixes.push({ ruleId: issue.id, reason: "Fix did not match the current file shape" });
  }

  return {
    original: content,
    fixed,
    appliedFixes,
    skippedFixes,
    success: appliedFixes.length > 0
  };
}

function replaceLine(
  content: string,
  issue: Issue,
  search: RegExp,
  replacement: string | ((substring: string, ...args: string[]) => string),
  description: string
) {
  const lines = content.split(/\r?\n/);
  const index = Math.max((issue.line ?? 1) - 1, 0);
  const original = lines[index] ?? "";
  const next = original.replace(search, replacement as string);
  if (next === original) return { content };
  lines[index] = next;
  return { content: lines.join("\n"), fix: applied(issue, original, next, description) };
}

function applied(issue: Issue, original: string, replacement: string, description: string): AppliedFix {
  return {
    ruleId: issue.id,
    description,
    lineNumber: issue.line,
    original,
    replacement
  };
}
