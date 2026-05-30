import { describe, expect, it } from "vitest";
import { applyFixes } from "./autofix";
import type { Issue } from "./types";

describe("autofix", () => {
  it("does not duplicate trailing newlines when applying multiple fixes", () => {
    const content = "FROM ubuntu:latest\nRUN apt-get update && apt-get install curl\n";
    const issues: Issue[] = [
      { id: "DOCKER_LATEST_TAG", title: "Latest tag", severity: "high", category: "security", autoFixable: true, line: 1, message: "", why: "", fix: "" },
      { id: "DOCKER_APT_NO_CLEAN", title: "No clean", severity: "medium", category: "reliability", autoFixable: true, line: 2, message: "", why: "", fix: "" }
    ];

    const result = applyFixes(content, issues);
    expect(result.success).toBe(true);
    expect(result.fixed).toBe("FROM ubuntu:stable\nRUN apt-get update && apt-get install --no-install-recommends curl && rm -rf /var/lib/apt/lists/*\n");
    expect(result.fixed.endsWith("\n\n")).toBe(false);
  });

  it("preserves CRLF line endings", () => {
    const content = "FROM ubuntu:latest\r\nRUN apt-get update && apt-get install curl\r\n";
    const issues: Issue[] = [
      { id: "DOCKER_LATEST_TAG", title: "Latest tag", severity: "high", category: "security", autoFixable: true, line: 1, message: "", why: "", fix: "" }
    ];

    const result = applyFixes(content, issues);
    expect(result.success).toBe(true);
    expect(result.fixed).toBe("FROM ubuntu:stable\r\nRUN apt-get update && apt-get install curl\r\n");
    expect(result.fixed.includes("\r\n")).toBe(true);
    expect(result.fixed.split("\r\n").length).toBe(3);
  });

  it("adds timeout to GitHub Actions safely", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest\n";
    const issues: Issue[] = [
      { id: "GHA_NO_TIMEOUT", title: "No timeout", severity: "medium", category: "reliability", autoFixable: true, line: 3, message: "", why: "", fix: "" }
    ];
    const result = applyFixes(content, issues);
    expect(result.success).toBe(true);
    expect(result.fixed).toBe("jobs:\n  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 30\n");
  });
});
