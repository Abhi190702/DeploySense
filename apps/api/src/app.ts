import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";
import { analyzeLog } from "@deploysense/log-doctor";
import { applyFixes, createProjectReport, toSarif } from "@deploysense/scanner-core";
import { listComposeRules } from "@deploysense/compose-scanner";
import { listDockerRules, scanDockerfile } from "@deploysense/docker-scanner";
import { listGithubActionsRules } from "@deploysense/github-actions-scanner";
import { listK8sRules } from "@deploysense/k8s-scanner";
import { getScan, getSharedScan, recentScans, shareScan, storeScan } from "./history";
import { detectScanner, scanByType } from "./scanners";

const scanSchema = z.object({
  content: z.string().min(1).max(500 * 1024),
  fileName: z.string().max(240).optional()
});

const projectSchema = z.object({
  files: z.array(z.object({ name: z.string().max(240), content: z.string().min(1).max(500 * 1024) })).max(20)
});

export const app: Express = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use(morgan("tiny"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.post("/api/scan/dockerfile", scanRoute("dockerfile", "Dockerfile"));
app.post("/api/scan/github-actions", scanRoute("github-actions", ".github/workflows/ci.yml"));
app.post("/api/scan/kubernetes", scanRoute("kubernetes", "deployment.yaml"));
app.post("/api/scan/compose", scanRoute("compose", "docker-compose.yml"));

app.post("/api/scan/auto", (req, res, next) => {
  try {
    const body = scanSchema.extend({ fileName: z.string().min(1).max(240) }).parse(req.body);
    const type = detectScanner(body.fileName, body.content);
    respondScan(req, res, storeScan(scanByType(type, body.content, body.fileName)));
  } catch (error) {
    next(error);
  }
});

app.post("/api/scan/project", (req, res, next) => {
  try {
    const body = projectSchema.parse(req.body);
    const results = body.files.map((file) => storeScan(scanByType(detectScanner(file.name, file.content), file.content, file.name)));
    res.json(createProjectReport(results, "api-upload"));
  } catch (error) {
    next(error);
  }
});

app.post("/api/doctor/logs", (req, res, next) => {
  try {
    const body = scanSchema.parse(req.body);
    res.json(analyzeLog(body.content));
  } catch (error) {
    next(error);
  }
});

app.post("/api/fix", (req, res, next) => {
  try {
    const body = scanSchema.extend({ fileName: z.string().min(1), ruleIds: z.array(z.string()).optional() }).parse(req.body);
    const result = scanByType(detectScanner(body.fileName, body.content), body.content, body.fileName);
    res.json(applyFixes(body.content, result.issues, body.ruleIds));
  } catch (error) {
    next(error);
  }
});

app.get("/api/rules", (req, res) => {
  const scanner = String(req.query.scanner ?? "");
  const severity = String(req.query.severity ?? "");
  const category = String(req.query.category ?? "");
  const rules = allRules()
    .filter((rule) => !scanner || rule.scanner === scanner || rule.scanner.includes(scanner))
    .filter((rule) => !severity || rule.severity === severity)
    .filter((rule) => !category || rule.category === category);
  res.json(rules);
});

app.get("/api/rules/:ruleId", (req, res, next) => {
  const rule = allRules().find((item) => item.id === req.params.ruleId);
  if (!rule) return next(httpError("NOT_FOUND", "Rule not found", 404));
  res.json(rule);
});

app.get("/api/scans/recent", (_req, res) => res.json(recentScans()));
app.get("/api/scans/:scanId", (req, res, next) => {
  const scan = getScan(req.params.scanId);
  if (!scan) return next(httpError("NOT_FOUND", "Scan not found", 404));
  res.json(scan);
});

app.post("/api/scans/:scanId/share", (req, res, next) => {
  const token = shareScan(req.params.scanId);
  if (!token) return next(httpError("NOT_FOUND", "Scan not found", 404));
  res.json({ shareToken: token, url: `/share/${token}` });
});

app.get("/api/share/:shareToken", (req, res, next) => {
  const scan = getSharedScan(req.params.shareToken);
  if (!scan) return next(httpError("NOT_FOUND", "Shared scan not found", 404));
  res.json(scan);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: { code: "INVALID_INPUT", message: error.issues[0]?.message ?? "Invalid input", statusCode: 400 } });
  }
  const maybe = error as { statusCode?: number; code?: string; message?: string };
  res.status(maybe.statusCode ?? 500).json({
    error: {
      code: maybe.code ?? "INTERNAL_ERROR",
      message: maybe.message ?? "Unexpected server error",
      statusCode: maybe.statusCode ?? 500
    }
  });
});

function scanRoute(type: "dockerfile" | "github-actions" | "kubernetes" | "compose", fallbackName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = scanSchema.parse(req.body);
      respondScan(req, res, storeScan(scanByType(type, body.content, body.fileName ?? fallbackName)));
    } catch (error) {
      next(error);
    }
  };
}

function respondScan(req: Request, res: Response, result: ReturnType<typeof storeScan>) {
  if ((req.get("accept") ?? "").includes("application/sarif+json")) {
    res.type("application/sarif+json").send(toSarif(result));
    return;
  }
  res.json(result);
}

function allRules() {
  return [
    ...listDockerRules().map((rule) => ({ scanner: "dockerfile", ...rule })),
    ...listGithubActionsRules().map((rule) => ({ scanner: "github-actions", ...rule })),
    ...listK8sRules().map((rule) => ({ scanner: "kubernetes", ...rule })),
    ...listComposeRules().map((rule) => ({ scanner: "compose", ...rule }))
  ];
}

function httpError(code: string, message: string, statusCode: number) {
  return { code, message, statusCode };
}
