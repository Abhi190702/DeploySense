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

Publish the generated tarballs, not the workspace package directories. `pnpm npm:check` creates tarballs in `.npm-packages/` and verifies that their manifests contain npm-compatible dependency versions.

```bash
npm publish .npm-packages/deploysense-scanner-core-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-docker-scanner-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-github-actions-scanner-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-k8s-scanner-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-compose-scanner-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-log-doctor-0.1.1.tgz --access public
npm publish .npm-packages/deploysense-0.1.1.tgz
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
