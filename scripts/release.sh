#!/usr/bin/env bash
set -euo pipefail

pnpm test
pnpm typecheck
pnpm lint
pnpm build
npx deploysense scan examples/broken-dockerfiles/node-bad.Dockerfile --quiet
test -f README.md
test -f CHANGELOG.md
echo "Release checks passed."
