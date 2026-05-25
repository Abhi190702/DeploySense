# Architecture

DeploySense is a pnpm TypeScript monorepo.

```text
apps/web       Next.js dashboard
apps/api       Express API
packages/cli   Node CLI
packages/*     scanner packages
```

All scanners use `scanner-core` for rules, scoring, reports, SARIF, and project aggregation.
