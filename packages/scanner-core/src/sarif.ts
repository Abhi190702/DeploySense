import type { ScanResult } from "./types";

export function toSarif(result: ScanResult): string {
  const rules = Array.from(new Map(result.issues.map((issue) => [issue.id, issue])).values()).map((issue) => ({
    id: issue.id,
    shortDescription: { text: issue.title },
    fullDescription: { text: issue.why },
    help: { text: issue.fix },
    properties: {
      category: issue.category,
      severity: issue.severity,
      tags: issue.tags ?? []
    }
  }));

  const results = result.issues.map((issue) => ({
    ruleId: issue.id,
    level: issue.severity === "critical" || issue.severity === "high" ? "error" : issue.severity === "info" ? "note" : "warning",
    message: { text: `${issue.title}: ${issue.fix}` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: issue.file },
          region: issue.line ? { startLine: issue.line, startColumn: issue.column ?? 1 } : undefined
        }
      }
    ]
  }));

  return JSON.stringify(
    {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [
        {
          tool: {
            driver: {
              name: "DeploySense",
              informationUri: "https://github.com/Abhi190702/DeploySense",
              rules
            }
          },
          results
        }
      ]
    },
    null,
    2
  );
}
