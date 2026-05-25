import * as vscode from "vscode";
import type { Issue, ScanResult } from "@deploysense/scanner-core";

export function diagnosticsFor(result: ScanResult): vscode.Diagnostic[] {
  return result.issues.map((issue) => {
    const line = Math.max(0, (issue.line ?? 1) - 1);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(line, 0, line, 200),
      `${issue.title}: ${issue.fix}`,
      severity(issue)
    );
    diagnostic.source = "DeploySense";
    diagnostic.code = issue.id;
    return diagnostic;
  });
}

function severity(issue: Issue): vscode.DiagnosticSeverity {
  if (issue.severity === "critical" || issue.severity === "high") return vscode.DiagnosticSeverity.Error;
  if (issue.severity === "medium" || issue.severity === "low") return vscode.DiagnosticSeverity.Warning;
  return vscode.DiagnosticSeverity.Information;
}
