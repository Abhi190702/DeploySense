import type { Rule, RuleInput } from "@deploysense/scanner-core";
import type { ParsedWorkflow, WorkflowJob, WorkflowStep } from "../parser";

function workflow(input: RuleInput): ParsedWorkflow {
  return input.parsed as ParsedWorkflow;
}

function yIssue(input: RuleInput, rule: Rule, message: string, why: string, fix: string, badExample: string, goodExample: string, autoFixable = rule.autoFixable ?? false) {
  return {
    file: input.filePath,
    message,
    why,
    fix,
    badExample,
    goodExample,
    diffPreview: `- ${badExample}\n+ ${goodExample}`,
    autoFixable
  };
}

const runText = (job: WorkflowJob) => job.steps.map((step) => `${step.name ?? ""} ${step.uses ?? ""} ${step.run ?? ""}`).join("\n");
const hasInstall = (job: WorkflowJob) => /(npm|pnpm|yarn)\s+(install|ci)|pip\s+install/i.test(runText(job));
const hasBuild = (job: WorkflowJob) => /\b(build|npm run build|go build|gradle build|mvn package)\b/i.test(runText(job));
const hasTest = (job: WorkflowJob) => /\b(test|jest|pytest|vitest|mocha)\b/i.test(runText(job));
const hasCache = (job: WorkflowJob) => job.steps.some((step) => step.type === "cache" || (step.type === "setup-node" && Boolean(step.with?.cache)));
const uses = (wf: ParsedWorkflow) => wf.jobs.flatMap((job) => job.steps).filter((step): step is WorkflowStep & { uses: string } => Boolean(step.uses));

export const githubActionsRules: Rule[] = [
  {
    id: "GHA_NO_CHECKOUT",
    title: "Missing actions/checkout",
    severity: "critical",
    category: "cicd_quality",
    tags: ["workflow", "checkout"],
    autoFixable: true,
    check(input) {
      const first = workflow(input).jobs[0];
      if (!first || first.steps.some((step) => step.type === "checkout")) return { issues: [] };
      return { issues: [yIssue(input, this, "Workflow job has steps but no checkout.", "Most build and git commands require the repository files to be present.", "Add actions/checkout@v4 as the first step.", "steps:\n  - run: npm test", "steps:\n  - uses: actions/checkout@v4\n  - run: npm test", true)] };
    }
  },
  {
    id: "GHA_NO_TEST_STEP",
    title: "Build workflow has no test step",
    severity: "high",
    category: "cicd_quality",
    tags: ["tests"],
    autoFixable: false,
    check(input) {
      const job = workflow(input).jobs.find((item) => hasBuild(item) && !hasTest(item));
      return { issues: job ? [yIssue(input, this, `Job ${job.id} builds without running tests.`, "CI can ship broken builds if tests do not run before artifacts are produced.", "Add a test step before the build step.", "run: npm run build", "run: npm test\nrun: npm run build")] : [] };
    }
  },
  {
    id: "GHA_NO_DEPENDENCY_CACHE",
    title: "Dependency install has no cache",
    severity: "medium",
    category: "performance",
    tags: ["cache"],
    autoFixable: true,
    check(input) {
      const job = workflow(input).jobs.find((item) => hasInstall(item) && !hasCache(item));
      return { issues: job ? [yIssue(input, this, `Job ${job.id} installs dependencies without cache.`, "Repeated cold dependency installs slow every CI run and waste minutes.", "Add actions/cache or setup-node cache configuration.", "run: npm ci", "uses: actions/setup-node@v4\nwith:\n  node-version: '20'\n  cache: npm", true)] : [] };
    }
  },
  {
    id: "GHA_UNPINNED_ACTION",
    title: "Action pinned to mutable branch",
    severity: "medium",
    category: "security",
    tags: ["pinning"],
    autoFixable: false,
    check(input) {
      return { issues: uses(workflow(input)).filter((step) => /@(main|master)$/i.test(step.uses)).map((step) => yIssue(input, this, `${step.uses} uses a mutable branch.`, "Mutable action refs can change without review and alter your CI behavior.", "Pin to a version tag or commit SHA.", `uses: ${step.uses}`, `uses: ${step.uses.replace(/@(main|master)$/i, "@v4")}`)) };
    }
  },
  {
    id: "GHA_SECRET_ECHO_RISK",
    title: "Secret may be echoed to logs",
    severity: "critical",
    category: "security",
    tags: ["secrets"],
    autoFixable: false,
    check(input) {
      const steps = workflow(input).jobs.flatMap((job) => job.steps).filter((step) => /echo\s+\$\{\{\s*secrets\./i.test(step.run ?? ""));
      return { issues: steps.map((step) => yIssue(input, this, "Step echoes a GitHub secret.", "Logs can retain sensitive values and expose them to anyone with workflow log access.", "Pass secrets through env and never echo them.", step.run ?? "", "env:\n  TOKEN: ${{ secrets.TOKEN }}\nrun: npm publish")) };
    }
  },
  {
    id: "GHA_NO_TIMEOUT",
    title: "Job timeout not configured",
    severity: "medium",
    category: "reliability",
    tags: ["timeout"],
    autoFixable: true,
    check(input) {
      return { issues: workflow(input).jobs.filter((job) => !job.timeoutMinutes).map((job) => yIssue(input, this, `Job ${job.id} has no timeout-minutes.`, "Hung jobs can burn runner minutes and block deployment pipelines.", "Add timeout-minutes: 30 to each job.", `${job.id}:`, `${job.id}:\n  timeout-minutes: 30`, true)) };
    }
  },
  {
    id: "GHA_BROAD_PERMISSIONS",
    title: "Workflow permissions are too broad or implicit",
    severity: "high",
    category: "security",
    tags: ["permissions"],
    autoFixable: false,
    check(input) {
      const wf = workflow(input);
      if (wf.permissions && wf.permissions !== "write-all") return { issues: [] };
      return { issues: [yIssue(input, this, "Workflow lacks explicit least-privilege permissions.", "Default or write-all token permissions increase damage if a workflow is compromised.", "Use minimal permissions such as contents: read.", "permissions: write-all", "permissions:\n  contents: read")] };
    }
  },
  {
    id: "GHA_NO_CONCURRENCY",
    title: "No concurrency group configured",
    severity: "low",
    category: "cicd_quality",
    tags: ["deployments"],
    autoFixable: true,
    check(input) {
      return { issues: workflow(input).concurrency ? [] : [yIssue(input, this, "Workflow has no concurrency group.", "Multiple deployment runs can race and overwrite each other.", "Add a concurrency group with cancel-in-progress.", "name: CI", "concurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true", true)] };
    }
  },
  {
    id: "GHA_WINDOWS_ONLY",
    title: "Workflow only runs on Windows",
    severity: "info",
    category: "maintainability",
    tags: ["matrix"],
    autoFixable: false,
    check(input) {
      const jobs = workflow(input).jobs;
      const windowsOnly = jobs.length > 0 && jobs.every((job) => String(job.runsOn).toLowerCase().includes("windows"));
      return { issues: windowsOnly ? [yIssue(input, this, "All jobs run only on Windows.", "Linux runners are cheaper and catch cross-platform deployment issues for most server workloads.", "Consider adding ubuntu-latest to the matrix.", "runs-on: windows-latest", "runs-on: ubuntu-latest")] : [] };
    }
  },
  {
    id: "GHA_NO_NODE_VERSION",
    title: "setup-node version is not pinned",
    severity: "medium",
    category: "reliability",
    tags: ["node"],
    autoFixable: true,
    check(input) {
      const steps = workflow(input).jobs.flatMap((job) => job.steps).filter((step) => step.type === "setup-node" && (!step.with?.["node-version"] || step.with["node-version"] === "latest"));
      return { issues: steps.map((step) => yIssue(input, this, "setup-node does not pin node-version.", "Floating Node versions can break builds when a new major version is released.", "Pin node-version to a supported major such as 20.", "uses: actions/setup-node@v4", "uses: actions/setup-node@v4\nwith:\n  node-version: '20'", true)) };
    }
  },
  {
    id: "GHA_NO_ARTIFACT_UPLOAD",
    title: "Build output is not uploaded",
    severity: "info",
    category: "cicd_quality",
    tags: ["artifacts"],
    autoFixable: false,
    check(input) {
      const job = workflow(input).jobs.find((item) => hasBuild(item) && !item.steps.some((step) => step.type === "upload-artifact"));
      return { issues: job ? [yIssue(input, this, `Job ${job.id} builds but uploads no artifact.`, "Artifacts make debugging and downstream deployment easier.", "Upload build artifacts with actions/upload-artifact.", "run: npm run build", "uses: actions/upload-artifact@v4\nwith:\n  path: dist")] : [] };
    }
  },
  {
    id: "GHA_DEPRECATED_ACTIONS_VERSION",
    title: "Deprecated official action version",
    severity: "medium",
    category: "maintainability",
    tags: ["upgrade"],
    autoFixable: true,
    check(input) {
      return { issues: uses(workflow(input)).filter((step) => /actions\/(checkout|setup-node)@v[23]$/i.test(step.uses)).map((step) => yIssue(input, this, `${step.uses} should be upgraded.`, "Older major versions miss security, runtime, and platform fixes.", "Upgrade to the latest supported major version.", `uses: ${step.uses}`, `uses: ${step.uses.replace(/@v[23]$/i, "@v4")}`, true)) };
    }
  }
];
