# Architecture

DeploySense is a pnpm TypeScript monorepo.

```text
apps/web       Next.js dashboard
apps/api       Express API
packages/cli   Node CLI
packages/*     scanner packages
```

All scanners use `scanner-core` for rules, scoring, reports, SARIF, and project aggregation.

## Project Architecture Graph

Project scans pass all discovered files into `scanner-core`'s architecture analyzer. The analyzer builds a lightweight graph with:

- nodes for pipelines, Dockerfiles, images, Kubernetes workloads, services, ingresses, and Compose services
- edges for build, deploy, image-use, exposure, and dependency relationships
- cross-file insights for mutable image chains, weak health signals, missing deployment pipelines, weak file linkage, and secret exposure paths

The graph is heuristic and intentionally explainable. It does not claim to be a full cloud inventory system yet; it gives users enough structure to see how configuration files relate and where the riskiest gaps live.
