import type { CategoryScore, Issue, ScanSummary, Severity } from "./types";

const penalties: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 1
};

const categories: (keyof CategoryScore)[] = [
  "security",
  "reliability",
  "performance",
  "cost",
  "maintainability",
  "cicd_quality"
];

export function severityWeight(severity: Severity): number {
  return penalties[severity];
}

export function gradeForScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function statusForGrade(grade: "A" | "B" | "C" | "D" | "F") {
  return {
    A: "excellent",
    B: "good",
    C: "needs_improvement",
    D: "poor",
    F: "critical"
  }[grade] as "excellent" | "good" | "needs_improvement" | "poor" | "critical";
}

export function summarizeIssues(issues: Issue[]): ScanSummary {
  const summary: ScanSummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: issues.length
  };
  for (const issue of issues) summary[issue.severity] += 1;
  return summary;
}

export function calculateScore(issues: Issue[]): {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "needs_improvement" | "poor" | "critical";
  categoryScores: CategoryScore;
} {
  const penalty = issues.reduce((sum, issue) => sum + penalties[issue.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade = gradeForScore(score);
  const categoryScores = categories.reduce((acc, category) => {
    const categoryPenalty = issues
      .filter((issue) => issue.category === category)
      .reduce((sum, issue) => sum + penalties[issue.severity], 0);
    acc[category] = Math.max(0, Math.min(100, 100 - categoryPenalty));
    return acc;
  }, {} as CategoryScore);

  return {
    score,
    grade,
    status: statusForGrade(grade),
    categoryScores
  };
}
