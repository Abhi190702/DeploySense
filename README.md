<div align="center">

# DeploySense

**Fix deployments before they break production.**

Open-source DevOps intelligence for Docker, Kubernetes, GitHub Actions, Docker Compose, and deployment logs.

</div>

<div align="center">

[![CI](https://img.shields.io/github/actions/workflow/status/Abhi190702/DeploySense/ci.yml?branch=main&style=for-the-badge&label=CI&logo=github)](https://github.com/Abhi190702/DeploySense/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/deploysense?style=for-the-badge&label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/deploysense)
[![License](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Abhi190702/DeploySense?style=for-the-badge&label=Release&color=f97316)](https://github.com/Abhi190702/DeploySense/releases)
[![Repo Size](https://img.shields.io/github/repo-size/Abhi190702/DeploySense?style=for-the-badge&color=22c55e)](https://github.com/Abhi190702/DeploySense)
[![Website](https://img.shields.io/badge/Website-Live-111827?style=for-the-badge&logo=vercel)](https://deploy-sense-web.vercel.app/)
[![API](https://img.shields.io/website?url=https%3A%2F%2Fdeploysense-api.onrender.com%2Fapi%2Fhealth&style=for-the-badge&label=API&up_message=Live&down_message=Sleeping)](https://deploysense-api.onrender.com/api/health)

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Abhi190702/DeploySense/badge)](https://scorecard.dev/viewer/?uri=github.com/Abhi190702/DeploySense)
[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF%20Best%20Practices-Not%20enrolled-64748b?style=flat)](https://www.bestpractices.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-91.6%25-brightgreen?style=flat)](#quality-and-security-signals)
[![Codecov](https://codecov.io/gh/Abhi190702/DeploySense/graph/badge.svg)](https://codecov.io/gh/Abhi190702/DeploySense)
[![Codespaces](https://img.shields.io/badge/Codespaces-Open-181717?style=flat&logo=githubcodespaces)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=1248935551)

</div>

-----

## Overview

**DeploySense** scans deployment configuration before it reaches production and returns health scores, risk categories, plain-English explanations, and concrete fixes. It is built for developers who want a fast local CLI, maintainers who want CI guardrails, and teams who want a lightweight web dashboard for reviewing deployment risk.

DeploySense currently covers Dockerfiles, GitHub Actions workflows, Kubernetes manifests, Docker Compose files, and deployment logs. The scanner engine is rule-based and contributor-friendly: every issue includes severity, category, why it matters, how to fix it, examples, and SARIF-compatible output for security tooling.

Live product links:

- Web dashboard: [deploy-sense-web.vercel.app](https://deploy-sense-web.vercel.app/)
- API health: [deploysense-api.onrender.com/api/health](https://deploysense-api.onrender.com/api/health)
- npm package: [deploysense](https://www.npmjs.com/package/deploysense)

-----

## Start Here

Run a scan without installing anything globally:

```bash
npx deploysense scan Dockerfile
```

Scan this repository after cloning:

```bash
git clone https://github.com/Abhi190702/DeploySense.git
cd DeploySense
pnpm install
pnpm build
npx deploysense scan examples/broken-dockerfiles/node-bad.Dockerfile
```

Use DeploySense in CI:

```bash
npx deploysense scan . --fail-on high --sarif
```

-----

## What It Detects

| Scanner | Rules | Examples |
|---|---:|---|
| Dockerfile | 12 | `latest` tags, root user, missing healthcheck, bad layer cache, secrets in `ENV` |
| GitHub Actions | 12 | missing checkout, unpinned actions, broad permissions, missing cache, missing timeouts |
| Kubernetes | 12 | missing resource limits, missing probes, privileged containers, single replica deployments |
| Docker Compose | 10 | exposed database ports, hardcoded secrets, duplicate host ports, missing restart policies |
| Log Doctor | 30+ | `ImagePullBackOff`, `CrashLoopBackOff`, OOM kills, port conflicts, CI permission errors |

-----

## Features

| Capability | Status |
|---|---|
| Health score, grade, and status | Ready |
| Severity and category scoring | Ready |
| CLI scanner and project scan | Ready |
| Express API server | Ready |
| Next.js web dashboard | Ready |
| SARIF output for code scanning | Ready |
| Markdown and JSON reports | Ready |
| Log Doctor explanations | Ready |
| Safe auto-fix engine | Ready |
| GitHub Action MVP | Ready |
| VS Code extension MVP | Ready |
| Shareable report links | Ready |

-----

## CLI

Install globally:

```bash
npm install -g deploysense
deploysense scan .
```

Common commands:

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

Example output:

```text
Score: 68/100  [C]  Needs Improvement

Issues Found: 4
Critical: 0   High: 1   Medium: 2   Low: 1

[HIGH] DOCKER_NO_HEALTHCHECK
Missing HEALTHCHECK instruction
Fix: Add HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1
```

-----

## Web Dashboard

DeploySense Web is live at [deploy-sense-web.vercel.app](https://deploy-sense-web.vercel.app/).

Run it locally:

```bash
pnpm --filter web dev
```

Set the API URL when deploying:

```bash
NEXT_PUBLIC_API_URL=https://deploysense-api.onrender.com
```

The dashboard includes a scan workspace, Monaco editor, rules explorer, docs, contribution page, badge generator, and shared report pages.

-----

## API

DeploySense API is live at [deploysense-api.onrender.com](https://deploysense-api.onrender.com/api/health).

Run locally:

```bash
pnpm --filter api dev
```

Scan a Dockerfile:

```bash
curl -X POST http://localhost:3001/api/scan/dockerfile \
  -H "Content-Type: application/json" \
  -d '{"content":"FROM node:latest\nCOPY . .\n"}'
```

-----

## GitHub Action

Use DeploySense in a workflow:

```yaml
name: DeploySense

on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./packages/github-action
        with:
          scan-path: .
          fail-on: high
          comment-pr: true
```

The GitHub Action is built, but it still needs real-world PR testing before marketplace release.

-----

## Architecture

```text
                 DeploySense

   CLI          Web          API          GitHub Action
    |            |            |                 |
    +------------+------------+-----------------+
                 |
          scanner-core engine
                 |
   +-------------+-------------+--------------+-------------+
   |             |             |              |             |
Dockerfile  GitHub Actions  Kubernetes  Docker Compose  Log Doctor
```

-----

## Quality And Security Signals

Open-source trust signals are being added carefully:

- **OpenSSF Scorecard** checks repository security posture such as branch protection, dependency pinning, token permissions, and dangerous workflow patterns. CI publishes Scorecard results and uploads SARIF alerts.
- **OpenSSF Best Practices** is a Linux Foundation badge program. It requires registering the project and answering project governance/security questions.
- **Codecov** shows tracked test coverage over time. The current local test suite reports **91.6%** coverage, and CI uploads `coverage/lcov.info`.

These are shown as pending/setup badges until the external services are connected. No fake passing badges.

-----

## Contributing

DeploySense is designed for contributors. Good first contributions include:

- Add a new scanner rule
- Improve a rule explanation
- Add a Log Doctor pattern
- Improve the dashboard UX
- Expand docs and examples
- Test the GitHub Action in a real pull request

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, rule-writing guidance, code style, and pull request workflow.

-----

## Self-Hosting

```bash
docker compose up -d
# Open http://localhost
```

Self-hosting runs the web dashboard, API server, and nginx reverse proxy.

-----

## Roadmap

- [x] Core scanner engine
- [x] Docker, GitHub Actions, Kubernetes, Compose, and Log Doctor scanners
- [x] CLI, API, web dashboard, GitHub Action MVP, VS Code MVP
- [x] npm package published
- [x] Public web and API deployment
- [x] Codecov integration
- [x] OpenSSF Scorecard workflow
- [ ] OpenSSF Best Practices enrollment
- [ ] GitHub Action marketplace release
- [ ] VS Code marketplace release
- [ ] Persistent share storage

-----

## Maintainer

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Abhi190702">
        <img src="https://avatars.githubusercontent.com/u/270758409?s=150" width="120" alt="Abhi190702"/><br/>
        <strong>Abhi190702</strong>
      </a>
      <br/>
      <a href="https://github.com/Abhi190702/DeploySense">
        <img src="https://img.shields.io/badge/GitHub-DeploySense-181717?style=flat&logo=github" alt="GitHub"/>
      </a>
    </td>
  </tr>
</table>

-----

## License

MIT. See [LICENSE](LICENSE).
