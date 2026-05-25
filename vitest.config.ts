import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "packages/scanner-core/src/{autofix,engine,project,report,sarif,scoring}.ts",
        "packages/docker-scanner/src/**/*.ts",
        "packages/github-actions-scanner/src/**/*.ts",
        "packages/k8s-scanner/src/**/*.ts",
        "packages/compose-scanner/src/**/*.ts",
        "packages/log-doctor/src/**/*.ts"
      ],
      exclude: [
        "**/*.test.ts",
        "**/dist/**",
        "**/types.ts",
        "**/index.ts",
        "packages/scanner-core/src/generateDocs.ts"
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
});
