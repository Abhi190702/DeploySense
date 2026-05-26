# Contributing to DeploySense

Thanks for helping build DeploySense.

## Development Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Add a Rule

1. Pick the scanner package.
2. Add a `Rule` object with id, title, severity, category, tags, and a `check` function.
3. Return issues with `why`, `fix`, `badExample`, `goodExample`, and `diffPreview`.
4. Export the rule from the scanner's `rules/index.ts`.
5. Add a bad fixture and a good fixture when useful.
6. Add or update tests.

## Code Style

- Keep rules deterministic and fast.
- Prefer parsers over fragile string matching when data is structured.
- Explain risk in plain English.
- Keep auto-fixes conservative.
- Add tests for major new behavior, especially new rules, parser changes, auto-fixes, and API endpoints.
- Avoid regexes that can backtrack heavily on user-controlled input. Prefer tokenizers, parsed YAML objects, or explicit character scans for hot paths.

## Pull Requests

Use focused PRs. Include validation commands and screenshots for UI changes.

## Issue Triage

Rules that are useful, easy to test, and safe to explain are great good-first-issue candidates.
