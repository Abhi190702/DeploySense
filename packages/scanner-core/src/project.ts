import { gradeForScore } from "./scoring";
import type { Issue, ProjectReport, ScanResult } from "./types";

const severityRank = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };

export function createProjectReport(scanResults: ScanResult[], projectPath: string): ProjectReport {
  const allIssues = scanResults.flatMap((result) => result.issues);
  const overallScore = scanResults.length
    ? Math.round(scanResults.reduce((sum, result) => sum + result.score, 0) / scanResults.length)
    : 100;
  const overallGrade = gradeForScore(overallScore);
  const topIssues: Issue[] = allIssues
    .slice()
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    .slice(0, 10);

  return {
    overallScore,
    overallGrade,
    scanResults,
    totalIssues: allIssues.length,
    topIssues,
    recommendations: topIssues.slice(0, 5).map((issue) => `${issue.id}: ${issue.fix}`),
    timestamp: new Date().toISOString(),
    projectPath
  };
}
