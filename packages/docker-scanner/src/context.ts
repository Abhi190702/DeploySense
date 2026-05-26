import fs from "node:fs";
import path from "node:path";

export interface DockerIgnoreContext {
  exists: boolean;
  path?: string;
  patterns: string[];
  ignoresSecrets: boolean;
  ignoresBuildNoise: boolean;
}

export interface DockerScanContext {
  filePath: string;
  projectRoot?: string;
  dockerignore: DockerIgnoreContext;
  lockfiles: string[];
  packageManager?: "npm" | "pnpm" | "yarn" | "python" | "go" | "java";
  nearbyFiles: string[];
}

const secretIgnoreHints = [
  ".env",
  ".env*",
  "*.pem",
  "*.key",
  "id_rsa",
  ".npmrc",
  ".pypirc",
  ".aws",
  ".ssh"
];

const noiseIgnoreHints = [
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  "__pycache__",
  ".pytest_cache"
];

export function inferDockerContext(filePath: string, override?: Partial<DockerScanContext> | false): DockerScanContext | undefined {
  if (override === false) return undefined;

  const resolved = path.resolve(filePath);
  const projectRoot = fs.existsSync(resolved) ? path.dirname(resolved) : undefined;
  const dockerignore = projectRoot ? readDockerignore(projectRoot) : emptyDockerignore();
  const nearbyFiles = projectRoot ? safeReaddir(projectRoot) : [];
  const lockfiles = nearbyFiles.filter((file) => [
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "requirements.txt",
    "pyproject.toml",
    "poetry.lock",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "gradle.lockfile"
  ].includes(file));

  const base: DockerScanContext = {
    filePath,
    projectRoot,
    dockerignore,
    nearbyFiles,
    lockfiles,
    packageManager: inferPackageManager(lockfiles, nearbyFiles)
  };

  if (!override) return base;
  return {
    ...base,
    ...override,
    dockerignore: { ...dockerignore, ...override.dockerignore }
  };
}

export function dockerContextFrom(input: { context?: Record<string, unknown> }): DockerScanContext | undefined {
  return input.context?.docker as DockerScanContext | undefined;
}

function readDockerignore(projectRoot: string): DockerIgnoreContext {
  const file = path.join(projectRoot, ".dockerignore");
  if (!fs.existsSync(file)) return emptyDockerignore();
  const patterns = fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return {
    exists: true,
    path: file,
    patterns,
    ignoresSecrets: hasAnyPattern(patterns, secretIgnoreHints),
    ignoresBuildNoise: hasAnyPattern(patterns, noiseIgnoreHints)
  };
}

function emptyDockerignore(): DockerIgnoreContext {
  return {
    exists: false,
    patterns: [],
    ignoresSecrets: false,
    ignoresBuildNoise: false
  };
}

function safeReaddir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function inferPackageManager(lockfiles: string[], nearbyFiles: string[]): DockerScanContext["packageManager"] {
  if (lockfiles.includes("pnpm-lock.yaml")) return "pnpm";
  if (lockfiles.includes("yarn.lock")) return "yarn";
  if (lockfiles.includes("package-lock.json") || lockfiles.includes("npm-shrinkwrap.json") || nearbyFiles.includes("package.json")) return "npm";
  if (lockfiles.some((file) => ["requirements.txt", "pyproject.toml", "poetry.lock"].includes(file))) return "python";
  if (lockfiles.includes("go.mod")) return "go";
  if (lockfiles.some((file) => ["pom.xml", "build.gradle", "gradle.lockfile"].includes(file))) return "java";
  return undefined;
}

function hasAnyPattern(patterns: string[], expected: string[]): boolean {
  const normalized = patterns.map(normalizeDockerignorePattern);
  return expected.some((hint) => {
    const needle = hint.toLowerCase();
    const searchableNeedle = needle.split("*").join("");
    return normalized.some((pattern) => pattern === needle || pattern.includes(searchableNeedle));
  });
}

function normalizeDockerignorePattern(pattern: string): string {
  let normalized = "";
  for (const char of pattern) {
    normalized += char === "\\" ? "/" : char.toLowerCase();
  }

  while (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }

  return normalized;
}
