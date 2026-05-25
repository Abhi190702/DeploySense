import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanCompose } from "../index";

const root = path.resolve(__dirname, "../../../..");

describe("compose scanner", () => {
  it("flags bad compose issues", () => {
    const content = fs.readFileSync(path.join(root, "examples/broken-compose/docker-compose-bad.yml"), "utf8");
    const result = scanCompose(content, "docker-compose.yml");
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("COMPOSE_LATEST_IMAGE");
    expect(ids).toContain("COMPOSE_NO_RESTART_POLICY");
    expect(ids).toContain("COMPOSE_NO_HEALTHCHECK");
    expect(ids).toContain("COMPOSE_HARDCODED_SECRET");
    expect(ids).toContain("COMPOSE_EXPOSED_DATABASE_PORT");
    expect(ids).toContain("COMPOSE_DB_NO_VOLUME");
    expect(ids).toContain("COMPOSE_PRIVILEGED_SERVICE");
    expect(ids).toContain("COMPOSE_DUPLICATE_HOST_PORT");
  });

  it("scores good compose highly", () => {
    const content = fs.readFileSync(path.join(root, "examples/good-compose/docker-compose-good.yml"), "utf8");
    const result = scanCompose(content, "docker-compose.yml");
    expect(result.score).toBeGreaterThan(80);
  });
});
