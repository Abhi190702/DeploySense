import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanKubernetes } from "../index";

const root = path.resolve(__dirname, "../../../..");

describe("kubernetes scanner", () => {
  it("flags bad deployment issues", () => {
    const content = fs.readFileSync(path.join(root, "examples/broken-k8s/deployment-bad.yaml"), "utf8");
    const result = scanKubernetes(content, "deployment.yaml");
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("K8S_LATEST_IMAGE");
    expect(ids).toContain("K8S_NO_RESOURCE_LIMITS");
    expect(ids).toContain("K8S_NO_RESOURCE_REQUESTS");
    expect(ids).toContain("K8S_NO_READINESS_PROBE");
    expect(ids).toContain("K8S_NO_LIVENESS_PROBE");
    expect(ids).toContain("K8S_SINGLE_REPLICA");
    expect(ids).toContain("K8S_PRIVILEGED_CONTAINER");
    expect(ids).toContain("K8S_SERVICE_PORT_MISMATCH");
  });

  it("scores good deployment highly", () => {
    const content = fs.readFileSync(path.join(root, "examples/good-k8s/deployment-good.yaml"), "utf8");
    const result = scanKubernetes(content, "deployment.yaml");
    expect(result.score).toBeGreaterThan(80);
  });
});
