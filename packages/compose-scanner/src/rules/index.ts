import type { Rule, RuleInput } from "@deploysense/scanner-core";
import type { ParsedCompose, ParsedComposeService } from "../parser";

function compose(input: RuleInput): ParsedCompose {
  return input.parsed as ParsedCompose;
}

function services(input: RuleInput): ParsedComposeService[] {
  return Object.values(compose(input).services);
}

function issue(input: RuleInput, message: string, why: string, fix: string, badExample: string, goodExample: string, autoFixable = false) {
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

function isDb(service: ParsedComposeService): boolean {
  const text = `${service.name} ${service.image ?? ""}`.toLowerCase();
  return /(postgres|mysql|mariadb|mongo|redis)/.test(text);
}

function envEntries(service: ParsedComposeService): [string, string][] {
  if (Array.isArray(service.environment)) {
    return service.environment.map((entry) => {
      const [key, ...rest] = String(entry).split("=");
      return [key, rest.join("=")];
    });
  }
  return Object.entries(service.environment ?? {}).map(([key, value]) => [key, String(value)]);
}

function hostPort(port: unknown): string | undefined {
  if (typeof port === "number") return undefined;
  if (typeof port === "string") return port.includes(":") ? port.split(":")[0] : undefined;
  if (port && typeof port === "object" && "published" in port) return String((port as { published?: unknown }).published);
  return undefined;
}

export const composeRules: Rule[] = [
  {
    id: "COMPOSE_LATEST_IMAGE",
    title: "Service image uses latest or no tag",
    severity: "medium",
    category: "reliability",
    tags: ["pinning"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => s.image && (!s.image.includes(":") || /:latest$/i.test(s.image))).map((s) => issue(input, `${s.name} uses an unpinned image.`, "Floating images make compose deployments hard to reproduce or roll back.", "Pin image tags to a specific version.", `image: ${s.image}`, `image: ${s.image?.replace(/:latest$/i, ":1.0.0") ?? "app:1.0.0"}`)) };
    }
  },
  {
    id: "COMPOSE_NO_RESTART_POLICY",
    title: "Service missing restart policy",
    severity: "medium",
    category: "reliability",
    tags: ["restart"],
    autoFixable: true,
    check(input) {
      return { issues: services(input).filter((s) => !s.restart).map((s) => issue(input, `${s.name} has no restart policy.`, "Services may stay down after a crash or host reboot.", "Add restart: unless-stopped.", `${s.name}:`, `${s.name}:\n  restart: unless-stopped`, true)) };
    }
  },
  {
    id: "COMPOSE_NO_HEALTHCHECK",
    title: "Service missing healthcheck",
    severity: "medium",
    category: "reliability",
    tags: ["healthcheck"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => !s.healthcheck).map((s) => issue(input, `${s.name} has no healthcheck.`, "Compose cannot tell whether the service is alive but unhealthy.", "Add a healthcheck block.", `${s.name}:`, "healthcheck:\n  test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:3000/health\"]")) };
    }
  },
  {
    id: "COMPOSE_HARDCODED_SECRET",
    title: "Hardcoded secret in environment",
    severity: "critical",
    category: "security",
    tags: ["secrets"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).flatMap((s) => envEntries(s).filter(([key, value]) => /(PASSWORD|SECRET|TOKEN|API_KEY|KEY)/i.test(key) && !/^\$\{[A-Z0-9_]+\}$/i.test(value)).map(([key]) => issue(input, `${s.name} hardcodes secret-like env var ${key}.`, "Compose files are often committed, copied, and shared; literal secrets leak easily.", "Use ${ENV_VAR} references and store actual values outside git.", `${key}: literal-secret`, `${key}: \${${key}}`))) };
    }
  },
  {
    id: "COMPOSE_EXPOSED_DATABASE_PORT",
    title: "Database port exposed to host",
    severity: "high",
    category: "security",
    tags: ["database"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => isDb(s) && (s.ports ?? []).some((p) => hostPort(p))).map((s) => issue(input, `${s.name} exposes a database port to the host.`, "Database ports should usually stay on the internal Docker network in production.", "Remove host port mapping and connect through the compose network.", `ports: ${JSON.stringify(s.ports)}`, "# no host ports")) };
    }
  },
  {
    id: "COMPOSE_DB_NO_VOLUME",
    title: "Database service has no persistent volume",
    severity: "high",
    category: "reliability",
    tags: ["database", "storage"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => isDb(s) && (!s.volumes || s.volumes.length === 0)).map((s) => issue(input, `${s.name} database has no volume.`, "Database data will be lost when the container is recreated.", "Add a named volume mount for database data.", `${s.name}:`, "volumes:\n  - db_data:/var/lib/postgresql/data")) };
    }
  },
  {
    id: "COMPOSE_NO_CUSTOM_NETWORK",
    title: "Compose file uses default network",
    severity: "low",
    category: "maintainability",
    tags: ["network"],
    autoFixable: false,
    check(input) {
      return { issues: compose(input).networks ? [] : [issue(input, "No custom network is defined.", "Named networks make service isolation and topology easier to inspect.", "Define custom named networks.", "services:\n  app:", "networks:\n  app_net: {}")] };
    }
  },
  {
    id: "COMPOSE_PRIVILEGED_SERVICE",
    title: "Service runs privileged",
    severity: "critical",
    category: "security",
    tags: ["privileged"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => s.privileged).map((s) => issue(input, `${s.name} uses privileged mode.`, "Privileged services get broad host capabilities and should be exceptional.", "Remove privileged: true unless absolutely required.", "privileged: true", "# privileged removed")) };
    }
  },
  {
    id: "COMPOSE_DUPLICATE_HOST_PORT",
    title: "Duplicate host port mapping",
    severity: "critical",
    category: "reliability",
    tags: ["ports"],
    autoFixable: false,
    check(input) {
      const seen = new Map<string, string>();
      const issues = [];
      for (const service of services(input)) {
        for (const port of service.ports ?? []) {
          const hp = hostPort(port);
          if (!hp) continue;
          if (seen.has(hp)) issues.push(issue(input, `${service.name} and ${seen.get(hp)} both publish host port ${hp}.`, "Only one container can bind a host port; the second service will fail to start.", "Change one service to use a different host port.", `${hp}:...`, `${Number(hp) + 1}:...`));
          seen.set(hp, service.name);
        }
      }
      return { issues };
    }
  },
  {
    id: "COMPOSE_BAD_DEPENDS_ON",
    title: "depends_on does not wait for health",
    severity: "medium",
    category: "reliability",
    tags: ["startup"],
    autoFixable: false,
    check(input) {
      return { issues: services(input).filter((s) => Array.isArray(s.depends_on)).map((s) => issue(input, `${s.name} uses simple depends_on list.`, "Simple depends_on only controls startup order, not service readiness.", "Use condition: service_healthy and add healthchecks to dependencies.", "depends_on:\n  - db", "depends_on:\n  db:\n    condition: service_healthy")) };
    }
  }
];
