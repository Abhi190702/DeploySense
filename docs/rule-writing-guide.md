# Rule Writing Guide

A DeploySense rule is a small deterministic check. It returns structured issues with risk context and a fix.

```ts
export const rule: Rule = {
  id: "DOCKER_EXAMPLE",
  title: "Example rule",
  severity: "medium",
  category: "reliability",
  check(input) {
    return { issues: [] };
  }
};
```

Rules should include bad examples, good examples, and a useful diff preview.
