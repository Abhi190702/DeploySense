import fs from "node:fs";
import os from "node:os";
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

  it("uses .dockerignore context to avoid broad COPY false positives", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deploysense-docker-context-"));
    const dockerfile = path.join(dir, "Dockerfile");
    fs.writeFileSync(path.join(dir, ".dockerignore"), "node_modules\n.git\n.env\n*.pem\n*.key\n.npmrc\ndist\ncoverage\n");
    fs.writeFileSync(dockerfile, good);

    const result = scanDockerfile(good, dockerfile);
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).not.toContain("DOCKER_NO_DOCKERIGNORE");
    expect(ids).not.toContain("DOCKER_COPY_SECRET_FILES");
  });

  it("detects enterprise supply-chain and package-manager risks", () => {
    const content = [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "ADD https://example.com/tool.tgz /tmp/tool.tgz",
      "RUN curl -fsSL https://example.com/install.sh | bash",
      "RUN apk add curl",
      "COPY package*.json ./",
      "RUN npm install",
      "COPY . .",
      "EXPOSE 3000",
      "HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1",
      "USER node",
      "CMD [\"node\", \"dist/index.js\"]"
    ].join("\n");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deploysense-docker-enterprise-"));
    const dockerfile = path.join(dir, "Dockerfile");
    fs.writeFileSync(path.join(dir, "package-lock.json"), "{}");
    fs.writeFileSync(path.join(dir, ".dockerignore"), "node_modules\n.git\ndist\ncoverage\n");
    fs.writeFileSync(dockerfile, content);

    const result = scanDockerfile(content, dockerfile);
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("DOCKER_UNPINNED_DIGEST");
    expect(ids).toContain("DOCKER_ADD_REMOTE_URL");
    expect(ids).toContain("DOCKER_CURL_PIPE_SHELL");
    expect(ids).toContain("DOCKER_APK_NO_CACHE");
    expect(ids).toContain("DOCKER_NPM_INSTALL_NOT_CI");
    expect(ids).toContain("DOCKER_COPY_SECRET_FILES");
    expect(result.issues.find((issue) => issue.id === "DOCKER_CURL_PIPE_SHELL")?.confidence).toBeGreaterThan(0.9);
  });

  it("detects Python and apt hygiene risks", () => {
    const content = [
      "FROM python:3.12-slim",
      "WORKDIR /app",
      "COPY requirements.txt ./",
      "RUN apt-get update",
      "RUN apt-get install -y curl",
      "RUN pip install -r requirements.txt",
      "COPY . .",
      "EXPOSE 8000",
      "HEALTHCHECK CMD python -c \"print('ok')\"",
      "USER nobody",
      "CMD [\"python\", \"app.py\"]"
    ].join("\n");

    const result = scanDockerfile(content, "Dockerfile", { context: false });
    const ids = result.issues.map((issue) => issue.id);
    expect(ids).toContain("DOCKER_APT_UPDATE_SPLIT");
    expect(ids).toContain("DOCKER_APT_NO_CLEAN");
    expect(ids).toContain("DOCKER_PIP_NO_CACHE_DIR");
  });
});
