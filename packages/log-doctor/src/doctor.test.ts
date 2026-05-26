import { describe, expect, it } from "vitest";
import { analyzeLog } from "./doctor";

describe("log doctor", () => {
  it("detects known deployment errors", () => {
    const result = analyzeLog("ImagePullBackOff\nCrashLoopBackOff\nECONNREFUSED\n");
    expect(result.errorsFound).toBe(3);
    expect(result.findings[0].debugCommands.length).toBeGreaterThan(0);
  });

  it("correlates related failures into an actionable chain", () => {
    const result = analyzeLog("ErrImagePull\nBack-off pulling image\nImagePullBackOff\n");
    expect(result.correlations.map((item) => item.id)).toContain("LOG_CHAIN_IMAGE_PULL");
    expect(result.summary).toContain("correlated failure chain");
  });
});
