import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateScore } from "@deploysense/scanner-core";
import { scanDockerfile } from "../../index";

const root = path.resolve(__dirname, "../../../../..");
const bad = fs.readFileSync(path.join(root, "examples/broken-dockerfiles/node-bad.Dockerfile"), "utf8");
const good = fs.readFileSync(path.join(root, "examples/good-dockerfiles/node-good.Dockerfile"), "utf8");

describe("docker scanner", () => {
  it("finds expected issues in a bad Dockerfile", () => {
    const result = scanDockerfile(bad, "node-bad.Dockerfile");
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("DOCKER_LATEST_TAG");
    expect(ids).toContain("DOCKER_NO_WORKDIR");
    expect(ids).toContain("DOCKER_NO_HEALTHCHECK");
    expect(ids).toContain("DOCKER_ROOT_USER");
    expect(ids).toContain("DOCKER_SECRET_IN_ENV");
    expect(ids).toContain("DOCKER_BAD_COPY_ORDER");
    expect(ids).toContain("DOCKER_NO_DOCKERIGNORE");
    expect(ids).toContain("DOCKER_NO_EXPOSE");
    expect(ids).toContain("DOCKER_NO_MULTI_STAGE");
    expect(ids).toContain("DOCKER_MULTIPLE_RUN_COMMANDS");
    expect(result.summary.total).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeLessThan(70);
    for (const issue of result.issues) {
      expect(issue.fix).toBeTruthy();
      expect(issue.why).toBeTruthy();
      expect(issue.badExample).toBeTruthy();
      expect(issue.goodExample).toBeTruthy();
    }
  });

  it("does not fire noisy rules on a good Dockerfile", () => {
    const result = scanDockerfile(good, "node-good.Dockerfile");
    expect(result.issues.map((issue) => issue.id)).not.toContain("DOCKER_LATEST_TAG");
    expect(result.issues.map((issue) => issue.id)).not.toContain("DOCKER_NO_WORKDIR");
    expect(result.issues.map((issue) => issue.id)).not.toContain("DOCKER_NO_HEALTHCHECK");
    expect(result.issues.map((issue) => issue.id)).not.toContain("DOCKER_ROOT_USER");
    expect(calculateScore(result.issues).score).toBeGreaterThan(80);
  });
});
