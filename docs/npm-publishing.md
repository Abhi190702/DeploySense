# NPM Publishing

DeploySense publishes one CLI package and six internal runtime packages:

- `@deploysense/scanner-core`
- `@deploysense/docker-scanner`
- `@deploysense/github-actions-scanner`
- `@deploysense/k8s-scanner`
- `@deploysense/compose-scanner`
- `@deploysense/log-doctor`
- `deploysense`

The CLI depends on the scoped runtime packages, so publish the scoped packages first.

## Before Publishing

1. Create or confirm access to the `@deploysense` npm organization/scope.
2. Log in locally:

```bash
npm login
npm whoami
```

3. Run all checks:

```bash
pnpm install
pnpm build
pnpm npm:check
pnpm lint
pnpm test
```

## Publish Order

```bash
pnpm --dir packages/scanner-core publish --access public
pnpm --dir packages/docker-scanner publish --access public
pnpm --dir packages/github-actions-scanner publish --access public
pnpm --dir packages/k8s-scanner publish --access public
pnpm --dir packages/compose-scanner publish --access public
pnpm --dir packages/log-doctor publish --access public
pnpm --dir packages/cli publish
```

## Verify

```bash
npm view deploysense version
npx deploysense --version
npx deploysense scan examples/broken-dockerfiles/node-bad.Dockerfile
```

After publishing, replace the README npm badge with:

```md
![npm](https://img.shields.io/npm/v/deploysense)
```
