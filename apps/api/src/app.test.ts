import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("api", () => {
  it("scans a Dockerfile", async () => {
    const res = await request(app)
      .post("/api/scan/dockerfile")
      .send({ content: "FROM node:latest\nCOPY . .\nCMD [\"npm\",\"start\"]\n" })
      .expect(200);
    expect(res.body.scanId).toBeTruthy();
    expect(res.body.issues.some((issue: { id: string }) => issue.id === "DOCKER_LATEST_TAG")).toBe(true);
  });

  it("lists rules", async () => {
    const res = await request(app).get("/api/rules?scanner=dockerfile").expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(12);
  });

  it("diagnoses logs", async () => {
    const res = await request(app).post("/api/doctor/logs").send({ content: "CrashLoopBackOff\n" }).expect(200);
    expect(res.body.errorsFound).toBe(1);
  });
});
