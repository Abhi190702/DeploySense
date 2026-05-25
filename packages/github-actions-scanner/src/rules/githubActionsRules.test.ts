import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanGithubActions } from "../index";

const root = path.resolve(__dirname, "../../../..");

describe("github actions scanner", () => {
  it("flags bad workflow issues", () => {
    const content = fs.readFileSync(path.join(root, "examples/broken-actions/node-ci-bad.yml"), "utf8");
    const result = scanGithubActions(content, "ci.yml");
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("GHA_NO_CHECKOUT");
    expect(ids).toContain("GHA_NO_TEST_STEP");
    expect(ids).toContain("GHA_NO_DEPENDENCY_CACHE");
    expect(ids).toContain("GHA_SECRET_ECHO_RISK");
    expect(ids).toContain("GHA_NO_TIMEOUT");
    expect(ids).toContain("GHA_BROAD_PERMISSIONS");
    expect(ids).toContain("GHA_NO_NODE_VERSION");
    expect(ids).toContain("GHA_DEPRECATED_ACTIONS_VERSION");
  });

  it("accepts good workflow", () => {
    const content = fs.readFileSync(path.join(root, "examples/good-actions/node-ci-good.yml"), "utf8");
    const result = scanGithubActions(content, "ci.yml");
    expect(result.score).toBeGreaterThan(80);
  });
});
