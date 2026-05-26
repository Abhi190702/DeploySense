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
    return replaceLineContent(content, issue, (line) => replaceCaseInsensitive(line, ":latest", ":stable"), "Replace latest tag with a stable tag placeholder");
  },
  DOCKER_APT_NO_CLEAN(content, issue) {
    return replaceLineContent(content, issue, (line) => {
      if (!containsIgnoreCase(line, "apt-get install") && !containsIgnoreCase(line, "apt install")) return line;
      let next = line;
      if (!containsIgnoreCase(next, "--no-install-recommends")) {
        next = replaceCaseInsensitive(next, "install", "install --no-install-recommends");
      }
      if (!next.includes("/var/lib/apt/lists/*")) {
        next = `${next} && rm -rf /var/lib/apt/lists/*`;
      }
      return next;
    }, "Clean apt package lists after install");
  },
  DOCKER_MULTIPLE_RUN_COMMANDS(content, issue) {
    const lines = splitLines(content);
    const start = Math.max((issue.line ?? 1) - 1, 0);
    const runLines = lines.slice(start, start + 3);
    if (runLines.length < 3 || !runLines.every(isRunInstruction)) {
      return { content };
    }
    const replacement = `RUN ${runLines.map((line) => stripRunInstruction(line).trim()).join(" && \\\n    ")}`;
    lines.splice(start, 3, replacement);
    return { content: lines.join("\n"), fix: applied(issue, runLines.join("\n"), replacement, "Merge consecutive RUN commands") };
  },
  GHA_NO_TIMEOUT(content, issue) {
    const lines = splitLines(content);
    const jobLine = Math.max((issue.line ?? 1) - 1, 0);
    lines.splice(jobLine + 1, 0, "    timeout-minutes: 30");
    return { content: lines.join("\n"), fix: applied(issue, "", "timeout-minutes: 30", "Add job timeout") };
  },
  GHA_NO_CONCURRENCY(content, issue) {
    const block = "concurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true\n";
    return { content: `${block}${content}`, fix: applied(issue, "", block.trim(), "Add concurrency cancellation") };
  },
  K8S_SINGLE_REPLICA(content, issue) {
    return replaceLineContent(content, issue, (line) => {
      const keyIndex = line.indexOf("replicas:");
      if (keyIndex === -1) return line;
      const value = line.slice(keyIndex + "replicas:".length).trim();
      if (value !== "1") return line;
      return `${line.slice(0, keyIndex)}replicas: 2`;
    }, "Increase replicas to 2");
  },
  COMPOSE_NO_RESTART_POLICY(content, issue) {
    const lines = splitLines(content);
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
    const safetyReason = safetyBlocker(fixed, issue);
    if (safetyReason) {
      skippedFixes.push({ ruleId: issue.id, reason: safetyReason });
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

function replaceLineContent(
  content: string,
  issue: Issue,
  transform: (line: string) => string,
  description: string
) {
  const lines = splitLines(content);
  const index = Math.max((issue.line ?? 1) - 1, 0);
  const original = lines[index] ?? "";
  const next = transform(original);
  if (next === original) return { content };
  lines[index] = next;
  return { content: lines.join("\n"), fix: applied(issue, original, next, description) };
}

function safetyBlocker(content: string, issue: Issue): string | undefined {
  if (issue.id.startsWith("DOCKER_") && content.includes("<<")) {
    return "Skipped because this Dockerfile uses a here-doc or complex shell block; review the suggested fix manually.";
  }
  if ((issue.id.startsWith("GHA_") || issue.id.startsWith("K8S_") || issue.id.startsWith("COMPOSE_")) && hasYamlAnchors(content)) {
    return "Skipped because this YAML uses anchors or aliases; AST-preserving YAML edits are required.";
  }
  return undefined;
}

function hasYamlAnchors(content: string): boolean {
  const words = content.split(" ");
  return words.some((word) => word.startsWith("&") || word.startsWith("*") || word.includes(":&") || word.includes(":*"));
}

function splitLines(value: string): string[] {
  const lines: string[] = [];
  let current = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\n") {
      lines.push(current.endsWith("\r") ? current.slice(0, -1) : current);
      current = "";
      continue;
    }
    current += char;
  }
  lines.push(current.endsWith("\r") ? current.slice(0, -1) : current);
  return lines;
}

function isRunInstruction(line: string): boolean {
  return stripLeadingWhitespace(line).toUpperCase().startsWith("RUN ");
}

function stripRunInstruction(line: string): string {
  const trimmed = stripLeadingWhitespace(line);
  return isRunInstruction(line) ? trimmed.slice(4) : line;
}

function stripLeadingWhitespace(value: string): string {
  let index = 0;
  while (index < value.length && (value[index] === " " || value[index] === "\t")) index += 1;
  return value.slice(index);
}

function containsIgnoreCase(source: string, needle: string): boolean {
  return source.toLowerCase().includes(needle.toLowerCase());
}

function replaceCaseInsensitive(source: string, needle: string, replacement: string): string {
  const index = source.toLowerCase().indexOf(needle.toLowerCase());
  if (index === -1) return source;
  return `${source.slice(0, index)}${replacement}${source.slice(index + needle.length)}`;
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
