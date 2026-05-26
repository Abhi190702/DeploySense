import { patterns } from "./patterns";
import type { ErrorExplanation, LogCorrelation, LogDoctorResult } from "./types";

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
  const correlations = correlateFindings(findings);

  return {
    totalLines: lines.length,
    errorsFound: findings.length,
    unknownErrors: unknownPatterns.length,
    findings,
    correlations,
    unknownPatterns,
    summary: findings.length
      ? `Detected ${findings.length} known deployment issue${findings.length === 1 ? "" : "s"} across ${lines.length} log lines${correlations.length ? `, including ${correlations.length} correlated failure chain${correlations.length === 1 ? "" : "s"}` : ""}.`
      : "No known deployment error patterns were detected."
  };
}

function correlateFindings(findings: ErrorExplanation[]): LogCorrelation[] {
  const ids = new Set(findings.map((finding) => finding.pattern));
  const correlations: LogCorrelation[] = [];

  if (ids.has("LOG_IMAGE_PULL_BACKOFF") && (ids.has("LOG_ERR_IMAGE_NEVER_PULL") || ids.has("LOG_IMAGE_PULL") || ids.has("LOG_BACKOFF_PULL"))) {
    correlations.push(correlation(
      "LOG_CHAIN_IMAGE_PULL",
      "Image pull failure chain",
      "high",
      findings,
      ["LOG_IMAGE_PULL_BACKOFF", "LOG_ERR_IMAGE_NEVER_PULL", "LOG_IMAGE_PULL", "LOG_BACKOFF_PULL"],
      "Kubernetes is repeatedly failing before the container starts, so application logs will not exist yet. Focus on the image reference, registry authentication, pull policy, and registry rate limits first.",
      ["Run kubectl describe pod <pod> and inspect Events.", "Verify the exact image tag exists in the registry.", "Check imagePullSecrets and namespace.", "Pin a known-good image tag or digest and redeploy."],
      0.92
    ));
  }

  if (ids.has("LOG_CRASH_LOOP") && (ids.has("LOG_NODE_MODULE_NOT_FOUND") || ids.has("LOG_MODULE_IMPORT") || ids.has("LOG_COMMAND_NOT_FOUND"))) {
    correlations.push(correlation(
      "LOG_CHAIN_STARTUP_DEPENDENCY",
      "Crash loop caused by missing runtime dependency",
      "high",
      findings,
      ["LOG_CRASH_LOOP", "LOG_NODE_MODULE_NOT_FOUND", "LOG_MODULE_IMPORT", "LOG_COMMAND_NOT_FOUND"],
      "The pod starts, then immediately exits because the runtime image is missing code, dependencies, or the entrypoint binary.",
      ["Read kubectl logs <pod> --previous.", "Rebuild the image with locked dependency installation.", "Check COPY order and multi-stage artifact paths.", "Run the final image locally with the same command."],
      0.88
    ));
  }

  if (ids.has("LOG_CRASH_LOOP") && ids.has("LOG_ECONNREFUSED")) {
    correlations.push(correlation(
      "LOG_CHAIN_DEPENDENCY_UNAVAILABLE",
      "Crash loop caused by unavailable dependency",
      "high",
      findings,
      ["LOG_CRASH_LOOP", "LOG_ECONNREFUSED"],
      "The application appears to exit during startup because a dependency such as a database or internal API is unreachable.",
      ["Check service DNS and port names.", "Verify dependency health checks.", "Use startup retries/backoff in the app.", "Gate rollout with readiness probes instead of crashing forever."],
      0.84
    ));
  }

  if (ids.has("LOG_OOM") && ids.has("LOG_CRASH_LOOP")) {
    correlations.push(correlation(
      "LOG_CHAIN_OOM_RESTART",
      "Restart loop caused by memory pressure",
      "high",
      findings,
      ["LOG_OOM", "LOG_CRASH_LOOP"],
      "The workload is being killed by the kernel or kubelet for memory usage, then Kubernetes restarts it repeatedly.",
      ["Inspect kubectl describe pod <pod> for OOMKilled.", "Compare memory limits with real usage.", "Raise limits or reduce startup memory.", "Add profiling before the next production rollout."],
      0.9
    ));
  }

  return correlations;
}

function correlation(
  id: string,
  title: string,
  severity: LogCorrelation["severity"],
  findings: ErrorExplanation[],
  evidencePatterns: string[],
  diagnosis: string,
  recommendedPath: string[],
  confidence: number
): LogCorrelation {
  const evidence = findings.filter((finding) => evidencePatterns.includes(finding.pattern));
  return {
    id,
    title,
    severity,
    evidencePatterns: Array.from(new Set(evidence.map((finding) => finding.pattern))),
    lineNumbers: evidence.map((finding) => finding.lineNumber),
    diagnosis,
    recommendedPath,
    confidence
  };
}
