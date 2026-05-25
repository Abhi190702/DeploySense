import { describe, expect, it } from "vitest";
import { calculateScore, summarizeIssues } from "./scoring";
import type { Issue } from "./types";

const issue = (severity: Issue["severity"]): Issue => ({
  id: `TEST_${severity}`,
  title: "Test issue",
  severity,
  category: "security",
  file: "file",
  message: "message",
  why: "why",
  fix: "fix",
  autoFixable: false
});

describe("scoring", () => {
  it("calculates score, grade, status, summary, and category score", () => {
    const issues = [issue("critical"), issue("high"), issue("medium"), issue("low"), issue("info")];
    const result = calculateScore(issues);
    expect(result.score).toBe(48);
    expect(result.grade).toBe("D");
    expect(result.status).toBe("poor");
    expect(result.categoryScores.security).toBe(48);
    expect(summarizeIssues(issues)).toEqual({ critical: 1, high: 1, medium: 1, low: 1, info: 1, total: 5 });
  });
});
