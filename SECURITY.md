# Security Policy

Please report security issues privately by opening a GitHub security advisory:

https://github.com/Abhi190702/DeploySense/security/advisories/new

You can also contact the maintainer through the GitHub profile:

https://github.com/Abhi190702

Do not disclose vulnerabilities publicly until we have had a reasonable chance to investigate and release a fix.

## Response Targets

- We aim to acknowledge new vulnerability reports within 14 days.
- We prioritize confirmed critical and high severity issues immediately.
- Public release notes will mention fixed public CVEs or equivalent vulnerability identifiers when applicable.

DeploySense scanners are deterministic and do not execute user-submitted configuration files. The API enforces size limits, rate limits, and security headers.

## Secure Development Notes

DeploySense is written in TypeScript and runs with Node.js. The project avoids implementing custom cryptography; when secure randomness is needed, it uses Node.js `crypto`. User-submitted files are parsed as text/YAML only and are never executed by the scanner. Auto-fixes are conservative and skip complex file shapes that require AST-preserving edits.
