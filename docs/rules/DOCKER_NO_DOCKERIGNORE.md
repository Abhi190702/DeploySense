# DOCKER_NO_DOCKERIGNORE

COPY . . should be paired with .dockerignore

- Severity: medium
- Category: performance
- Auto-fixable: no
- Tags: build-context

## Description

This rule detects a deployment risk in performance and reports a plain-English fix through the DeploySense scanner.

## How to Fix

Run `deploysense scan <file>` to see exact file-specific guidance and diff previews.
