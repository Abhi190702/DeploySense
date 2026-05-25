import { describe, expect, it } from "vitest";
import { analyzeLog } from "./doctor";

describe("log doctor", () => {
  it("detects known deployment errors", () => {
    const result = analyzeLog("ImagePullBackOff\nCrashLoopBackOff\nECONNREFUSED\n");
    expect(result.errorsFound).toBe(3);
    expect(result.findings[0].debugCommands.length).toBeGreaterThan(0);
  });
});
