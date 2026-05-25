import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".npm-packages");
const pnpmExecPath = process.env.npm_execpath?.includes("pnpm") ? process.env.npm_execpath : undefined;
const pnpmCommand = pnpmExecPath ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const pnpmArgsPrefix = pnpmExecPath ? [pnpmExecPath] : [];

const packages = [
  "packages/scanner-core",
  "packages/docker-scanner",
  "packages/github-actions-scanner",
  "packages/k8s-scanner",
  "packages/compose-scanner",
  "packages/log-doctor",
  "packages/cli"
];

const publishableNames = new Set();

function readPackageJson(packageDir) {
  const file = path.join(root, packageDir, "package.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

function fail(message) {
  throw new Error(`npm package check failed: ${message}`);
}

for (const packageDir of packages) {
  const pkg = readPackageJson(packageDir);
  publishableNames.add(pkg.name);
}

for (const packageDir of packages) {
  const pkg = readPackageJson(packageDir);
  const label = `${pkg.name} (${packageDir})`;

  if (!pkg.name) fail(`${label} is missing name`);
  if (!pkg.version) fail(`${label} is missing version`);
  if (!pkg.description) fail(`${label} is missing description`);
  if (pkg.private) fail(`${label} must not be private`);
  if (pkg.license !== "MIT") fail(`${label} must declare MIT license`);
  if (!pkg.repository?.url) fail(`${label} is missing repository.url`);
  if (!pkg.bugs?.url) fail(`${label} is missing bugs.url`);
  if (!pkg.homepage) fail(`${label} is missing homepage`);
  if (!Array.isArray(pkg.files) || !pkg.files.includes("dist")) {
    fail(`${label} must publish only dist via files`);
  }
  if (pkg.main !== "dist/index.js") fail(`${label} main must be dist/index.js`);
  if (pkg.types !== "dist/index.d.ts") fail(`${label} types must be dist/index.d.ts`);
  if (!existsSync(path.join(root, packageDir, "dist", "index.js"))) {
    fail(`${label} has not been built yet`);
  }
  if (!existsSync(path.join(root, packageDir, "dist", "index.d.ts"))) {
    fail(`${label} is missing generated type declarations`);
  }
  if (pkg.name.startsWith("@") && pkg.publishConfig?.access !== "public") {
    fail(`${label} scoped packages must publish with public access`);
  }

  for (const [dependencyName, version] of Object.entries(pkg.dependencies ?? {})) {
    const isWorkspaceVersion = typeof version === "string" && version.startsWith("workspace:");
    if (isWorkspaceVersion && !publishableNames.has(dependencyName)) {
      fail(`${label} has unpublished workspace dependency ${dependencyName}`);
    }
    if (publishableNames.has(dependencyName) && !isWorkspaceVersion && version !== pkg.version) {
      fail(`${label} depends on ${dependencyName}@${version}, expected ${pkg.version}`);
    }
  }
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const packageDir of packages) {
  const pkg = readPackageJson(packageDir);
  console.log(`Packing ${pkg.name}...`);
  const before = new Set(readdirSync(outDir));
  execFileSync(pnpmCommand, [...pnpmArgsPrefix, "--dir", path.join(root, packageDir), "pack", "--pack-destination", outDir], {
    cwd: root,
    stdio: "inherit"
  });
  const tarball = readdirSync(outDir).find((file) => file.endsWith(".tgz") && !before.has(file));
  if (!tarball) fail(`${pkg.name} did not produce a tarball`);

  const packedManifest = JSON.parse(execFileSync("tar", ["-xOf", path.join(outDir, tarball), "package/package.json"], {
    cwd: root,
    encoding: "utf8"
  }));

  if (packedManifest.name !== pkg.name) fail(`${pkg.name} packed manifest has wrong name`);
  if (packedManifest.version !== pkg.version) fail(`${pkg.name} packed manifest has wrong version`);

  for (const [dependencyName, version] of Object.entries(packedManifest.dependencies ?? {})) {
    if (typeof version === "string" && version.startsWith("workspace:")) {
      fail(`${pkg.name} packed manifest still contains workspace dependency ${dependencyName}`);
    }
    if (publishableNames.has(dependencyName) && version !== pkg.version) {
      fail(`${pkg.name} packed manifest depends on ${dependencyName}@${version}, expected ${pkg.version}`);
    }
  }
}

console.log(`npm package checks passed. Tarballs are in ${path.relative(root, outDir)}.`);
