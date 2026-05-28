# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅ Active  |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

### Option 1 — GitHub Private Advisory (Preferred)
Open a [private security advisory](https://github.com/Abhi190702/DeploySense/security/advisories/new) directly on GitHub. This is confidential and only visible to maintainers.

### Option 2 — Email
If you prefer email, contact the maintainer via their GitHub profile.

### What to include
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

### Response time
We aim to respond within **48 hours** and will keep you informed of progress.

### Scope
The following are in scope:
- `apps/api` — REST API endpoints (XSS, injection, auth bypass)
- `packages/cli` — CLI argument parsing and file access
- `packages/scanner-core` — Scanner rule logic
- `apps/web` — Next.js web application

Out of scope: third-party dependencies (please report those to their maintainers directly).

## Disclosure Policy
We follow **coordinated disclosure**. Once a fix is released, we will credit the reporter in the release notes (unless they prefer to remain anonymous).
