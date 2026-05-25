import YAML from "yaml";

export interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
  type: "checkout" | "setup-node" | "setup-python" | "cache" | "run" | "upload-artifact" | "uses";
}

export interface WorkflowJob {
  id: string;
  name?: string;
  runsOn?: string | string[];
  timeoutMinutes?: number;
  steps: WorkflowStep[];
  permissions?: unknown;
}

export interface ParsedWorkflow {
  name?: string;
  on?: unknown;
  permissions?: unknown;
  concurrency?: unknown;
  jobs: WorkflowJob[];
  raw: Record<string, unknown>;
}

export function parseWorkflow(content: string): ParsedWorkflow {
  const raw = (YAML.parse(content) ?? {}) as Record<string, unknown>;
  const jobsObject = (raw.jobs ?? {}) as Record<string, Record<string, unknown>>;
  const jobs = Object.entries(jobsObject).map(([id, job]) => {
    const steps = Array.isArray(job.steps) ? job.steps as Record<string, unknown>[] : [];
    return {
      id,
      name: job.name as string | undefined,
      runsOn: (job["runs-on"] ?? job.runsOn) as string | string[] | undefined,
      timeoutMinutes: (job["timeout-minutes"] ?? job.timeoutMinutes) as number | undefined,
      permissions: job.permissions,
      steps: steps.map(parseStep)
    };
  });
  return {
    name: raw.name as string | undefined,
    on: raw.on,
    permissions: raw.permissions,
    concurrency: raw.concurrency,
    jobs,
    raw
  };
}

function parseStep(step: Record<string, unknown>): WorkflowStep {
  const uses = step.uses as string | undefined;
  const run = step.run as string | undefined;
  let type: WorkflowStep["type"] = uses ? "uses" : "run";
  if (/actions\/checkout/i.test(uses ?? "")) type = "checkout";
  if (/actions\/setup-node/i.test(uses ?? "")) type = "setup-node";
  if (/actions\/setup-python/i.test(uses ?? "")) type = "setup-python";
  if (/actions\/cache/i.test(uses ?? "")) type = "cache";
  if (/actions\/upload-artifact/i.test(uses ?? "")) type = "upload-artifact";
  return {
    name: step.name as string | undefined,
    uses,
    run,
    with: step.with as Record<string, unknown> | undefined,
    env: step.env as Record<string, unknown> | undefined,
    type
  };
}
