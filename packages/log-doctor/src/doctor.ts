import { patterns } from "./patterns";
import type { ErrorExplanation, LogDoctorResult } from "./types";

const unknownLikeError = /(error|exception|failed|panic|fatal|denied|timeout|unavailable|refused)/i;

export function analyzeLog(logContent: string): LogDoctorResult {
  const lines = logContent.split(/\r?\n/);
  const findings: ErrorExplanation[] = [];
  const matchedLines = new Set<number>();

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.pattern.test(line)) {
        findings.push({
          pattern: pattern.id,
          title: pattern.title,
          severity: pattern.severity,
          matchedLine: line,
          lineNumber: index + 1,
          what: pattern.what,
          causes: pattern.causes,
          debugCommands: pattern.debugCommands,
          fixSteps: pattern.fixSteps,
          prevention: pattern.prevention,
          docsUrl: pattern.docsUrl
        });
        matchedLines.add(index + 1);
      }
    }
  });

  const unknownPatterns = lines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line, lineNumber }) => unknownLikeError.test(line) && !matchedLines.has(lineNumber))
    .map(({ line, lineNumber }) => `${lineNumber}: ${line}`)
    .slice(0, 20);

  return {
    totalLines: lines.length,
    errorsFound: findings.length,
    unknownErrors: unknownPatterns.length,
    findings,
    unknownPatterns,
    summary: findings.length
      ? `Detected ${findings.length} known deployment issue${findings.length === 1 ? "" : "s"} across ${lines.length} log lines.`
      : "No known deployment error patterns were detected."
  };
}
