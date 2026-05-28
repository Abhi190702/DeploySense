# Changelog

All notable changes to DeploySense will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- VS Code Extension — Marketplace release
- GitHub Action — Marketplace release
- OpenSSF Silver badge compliance

---

## [0.1.1] — 2026-05-28

### Added
- **CLI splash screen** — polished first-run ASCII art banner with smart suppression (no banner in CI, `--json`, `--sarif`, `--quiet` modes)
- **Profile badge API** — `GET /api/badge/contributions?user=<github>` generates an isometric SVG contribution chart
- **Hexagon brand logo** — new SVG favicon and navbar logo matching the DeploySense brand identity
- **`SECURITY.md`** — vulnerability reporting policy
- **`FUNDING.yml`** — GitHub Sponsors button
- **`CHANGELOG.md`** — this file

### Fixed
- **Security (High)** — XSS vulnerability in badge route: `username` is now validated against GitHub username regex and all strings are XML-escaped before SVG injection (CodeQL CWE-79)
- **Tests** — `res.text` → `res.body.toString()` for supertest SVG response assertions
- **Navbar** — replaced plain "DS" badge with hexagon + ECG heartbeat SVG brand mark
- **README banner** — broken image replaced with committed `docs/banner.png`

### Changed
- `@actions/core` pinned to `1.10.1`, `@actions/github` to `6.0.0` for CJS/ncc compatibility
- README updated: removed misleading Marketplace claims, added honest status notes

---

## [0.1.0] — 2026-05-25

### Added
- **`deploysense` CLI** — scan Dockerfiles, Kubernetes manifests, GitHub Actions workflows, Docker Compose files
- **`deploysense doctor`** — AI-assisted deployment log diagnosis
- **`deploysense scan --json/--sarif/--markdown`** — machine-readable output formats
- **`deploysense fix`** — safe auto-fix application with backup
- **REST API** — `POST /api/scan/*`, `GET /api/rules`, `POST /api/doctor/logs`
- **Web dashboard** — Next.js 16 with live scanner, score ring, and terminal output
- **Architecture graph** — detects service dependencies from multi-file project scans
- **GitHub Action** — local workflow integration
- **VS Code Extension** — in-editor scan diagnostics (MVP, local only)
- **OpenSSF Scorecard** integration
- **OpenSSF Best Practices** badge registration
- **Codecov** coverage reporting
- **Monorepo** — pnpm workspaces with Turbo build pipeline

[Unreleased]: https://github.com/Abhi190702/DeploySense/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Abhi190702/DeploySense/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Abhi190702/DeploySense/releases/tag/v0.1.0
