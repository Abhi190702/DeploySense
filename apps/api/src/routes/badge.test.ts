import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { Server } from "http";

let server: Server;

beforeAll(() => {
  server = app.listen(0);
});

afterAll(() => {
  server.close();
});

describe("GET /api/badge/contributions", () => {
  it("returns 400 and SVG when user param is missing", async () => {
    const res = await request(server).get("/api/badge/contributions");
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/image\/svg\+xml/);
    expect(res.body.toString()).toContain("<svg");
  });

  it("returns 200 and SVG with content-type image/svg+xml", async () => {
    const res = await request(server).get("/api/badge/contributions?user=Abhi190702");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/svg\+xml/);
    expect(res.body.toString()).toContain("<svg");
  });

  it("SVG contains the username (case-insensitive)", async () => {
    const res = await request(server).get("/api/badge/contributions?user=Abhi190702");
    expect(res.body.toString().toLowerCase()).toContain("abhi190702");
  });

  it("returns fallback SVG when GITHUB_TOKEN is not set", async () => {
    const saved = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;

    const res = await request(server).get("/api/badge/contributions?user=testuser");
    expect(res.status).toBe(200);
    expect(res.body.toString()).toContain("GITHUB_TOKEN");

    process.env.GITHUB_TOKEN = saved;
  });

  it("sets Cache-Control header with s-maxage", async () => {
    const res = await request(server).get("/api/badge/contributions?user=Abhi190702");
    expect(res.headers["cache-control"]).toMatch(/s-maxage=/);
  });
});
