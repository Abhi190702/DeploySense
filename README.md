# DeploySense

[![CI](https://github.com/Abhi190702/DeploySense/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhi190702/DeploySense/actions/workflows/ci.yml)
![npm](https://img.shields.io/npm/v/deploysense)
![license](https://img.shields.io/badge/license-MIT-22d3ee)
![good first issues](https://img.shields.io/github/issues/Abhi190702/DeploySense/good%20first%20issue)

> Fix deployments before they break production.

DeploySense is an open-source DevOps intelligence platform that scans Docker, Kubernetes, GitHub Actions, Docker Compose, and deployment logs for deployment risks. Get health scores, risk analysis, plain-English explanations, SARIF output, GitHub PR comments, and safe fixes in seconds.

Demo GIF coming soon. Run locally to see it in action.

## Features

| Feature | Status |
|---|---|
| Dockerfile scanner with 12 rules | Yes |
| GitHub Actions scanner with 12 rules | Yes |
| Kubernetes scanner with 12 rules | Yes |
| Docker Compose scanner with 10 rules | Yes |
| Log Doctor with 30+ patterns | Yes |
| CLI, API, web dashboard | Yes |
| SARIF, fail-on, config file, auto-fix engine | Yes |
| GitHub Action and VS Code MVP | Yes |

## Quick Start

```bash
pnpm install
pnpm build
npx deploysense scan examples/broken-dockerfiles/node-bad.Dockerfile
```

Install globally after publishing:

```bash
npm install -g deploysense
deploysense scan .
```

## CLI

```bash
deploysense scan Dockerfile
deploysense scan . --json
deploysense scan . --markdown
deploysense scan . --sarif
deploysense scan . --fail-on high
deploysense doctor examples/logs/sample-errors.txt
deploysense list-rules
deploysense fix Dockerfile --yes
```

## API

```bash
pnpm --filter api dev
curl -X POST http://localhost:3001/api/scan/dockerfile \
  -H "Content-Type: application/json" \
  -d '{"content":"FROM node:latest\nCOPY . .\n"}'
```

## Web Dashboard

```bash
pnpm --filter web dev
```

Open `http://localhost:3000` for the landing page, scanner workspace, rules explorer, docs, contribution page, badge generator, and shared reports.

## GitHub Action

```yaml
- uses: actions/checkout@v4
- uses: ./packages/github-action
  with:
    scan-path: .
    fail-on: high
    comment-pr: true
```

## Self-host

```bash
docker compose up -d
# Open http://localhost
```

## Architecture

```text
CLI / API / Web / GitHub Action / VS Code
             |
     scanner-core engine
             |
Docker | GitHub Actions | Kubernetes | Compose | Log Doctor
```

## Contributing

DeploySense is designed for contributors. Add a rule, improve the UI, write docs, or expand Log Doctor patterns.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) and browse [docs/good-first-issues](./docs/good-first-issues).

## Roadmap

- [x] v1 scanner platform
- [x] dashboard and API
- [ ] hosted persistence and team projects
- [ ] VS Code marketplace release

## License

MIT
