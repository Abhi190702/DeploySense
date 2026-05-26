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

  it("returns architecture data for project scans", async () => {
    const res = await request(app)
      .post("/api/scan/project")
      .send({
        files: [
          { name: "Dockerfile", content: "FROM node:latest\nCOPY . .\n" },
          { name: ".github/workflows/deploy.yml", content: "jobs:\n  deploy:\n    steps:\n      - run: docker build -t ghcr.io/acme/api:latest .\n      - run: kubectl apply -f k8s/\n" },
          { name: "k8s/deployment.yaml", content: "kind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      containers:\n        - image: ghcr.io/acme/api:latest\n" }
        ]
      })
      .expect(200);
    expect(res.body.architecture.nodes.length).toBeGreaterThan(2);
    expect(res.body.architecture.insights.some((insight: { id: string }) => insight.id === "ARCH_MUTABLE_IMAGE_CHAIN")).toBe(true);
  });

  it("diagnoses logs", async () => {
    const res = await request(app).post("/api/doctor/logs").send({ content: "CrashLoopBackOff\n" }).expect(200);
    expect(res.body.errorsFound).toBe(1);
  });
});
