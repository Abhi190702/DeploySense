import type { Rule, RuleInput } from "@deploysense/scanner-core";
import type { ParsedK8sResource } from "../parser";

type AnyMap = Record<string, any>;

function resources(input: RuleInput): ParsedK8sResource[] {
  return input.parsed as ParsedK8sResource[];
}

function pods(resource: ParsedK8sResource): AnyMap[] {
  const spec: AnyMap = resource.spec;
  if (resource.kind === "Pod") return spec.containers ?? [];
  return spec.template?.spec?.containers ?? [];
}

function resourceLabels(resource: ParsedK8sResource): AnyMap {
  return (resource.metadata.labels ?? {}) as AnyMap;
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

const workloadKinds = new Set(["Deployment", "StatefulSet", "DaemonSet", "Pod"]);
const controllerKinds = new Set(["Deployment", "StatefulSet", "DaemonSet"]);

export const k8sRules: Rule[] = [
  {
    id: "K8S_LATEST_IMAGE",
    title: "Container image uses latest tag",
    severity: "medium",
    category: "reliability",
    tags: ["pinning"],
    autoFixable: false,
    check(input) {
      const hits = resources(input).flatMap((resource) => pods(resource).filter((container) => /:latest$/i.test(container.image ?? "")).map((container) => ({ resource, container })));
      return { issues: hits.map(({ resource, container }) => issue(input, `${resource.kind} container ${container.name ?? ""} uses :latest.`, "Floating image tags make rollbacks and reproducible deploys unreliable.", "Pin the image to a specific version.", `image: ${container.image}`, "image: app:1.2.3")) };
    }
  },
  {
    id: "K8S_NO_RESOURCE_LIMITS",
    title: "Container missing resource limits",
    severity: "high",
    category: "cost",
    tags: ["resources"],
    autoFixable: true,
    check(input) {
      return { issues: resources(input).filter((r) => workloadKinds.has(r.kind)).flatMap((resource) => pods(resource).filter((c) => !c.resources?.limits).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} has no resource limits.`, "Without limits a noisy container can consume node resources and raise infrastructure cost.", "Add cpu and memory limits.", `name: ${container.name ?? "app"}`, "resources:\n  limits:\n    cpu: 500m\n    memory: 512Mi", true))) };
    }
  },
  {
    id: "K8S_NO_RESOURCE_REQUESTS",
    title: "Container missing resource requests",
    severity: "high",
    category: "reliability",
    tags: ["resources"],
    autoFixable: true,
    check(input) {
      return { issues: resources(input).filter((r) => workloadKinds.has(r.kind)).flatMap((resource) => pods(resource).filter((c) => !c.resources?.requests).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} has no resource requests.`, "The scheduler cannot place pods reliably without realistic resource requests.", "Add cpu and memory requests.", `name: ${container.name ?? "app"}`, "resources:\n  requests:\n    cpu: 100m\n    memory: 128Mi", true))) };
    }
  },
  {
    id: "K8S_NO_READINESS_PROBE",
    title: "Deployment missing readiness probe",
    severity: "high",
    category: "reliability",
    tags: ["probes"],
    autoFixable: false,
    check(input) {
      return { issues: resources(input).filter((r) => controllerKinds.has(r.kind)).flatMap((resource) => pods(resource).filter((c) => !c.readinessProbe).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} has no readinessProbe.`, "Traffic can be routed to containers before they are ready to serve requests.", "Add a readinessProbe with httpGet path and port.", `name: ${container.name ?? "app"}`, "readinessProbe:\n  httpGet:\n    path: /health\n    port: 3000"))) };
    }
  },
  {
    id: "K8S_NO_LIVENESS_PROBE",
    title: "Deployment missing liveness probe",
    severity: "high",
    category: "reliability",
    tags: ["probes"],
    autoFixable: false,
    check(input) {
      return { issues: resources(input).filter((r) => controllerKinds.has(r.kind)).flatMap((resource) => pods(resource).filter((c) => !c.livenessProbe).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} has no livenessProbe.`, "Broken containers may stay running forever without being restarted.", "Add a livenessProbe.", `name: ${container.name ?? "app"}`, "livenessProbe:\n  httpGet:\n    path: /health\n    port: 3000"))) };
    }
  },
  {
    id: "K8S_SINGLE_REPLICA",
    title: "Deployment has a single replica",
    severity: "medium",
    category: "reliability",
    tags: ["availability"],
    autoFixable: true,
    check(input) {
      return { issues: resources(input).filter((r) => r.kind === "Deployment" && (((r.spec as AnyMap).replicas ?? 1) <= 1)).map((resource) => issue(input, `${resource.metadata.name ?? "Deployment"} has one or zero replicas.`, "A single pod can make maintenance or pod failure user-visible.", "Use at least 2 replicas for production.", "replicas: 1", "replicas: 2", true)) };
    }
  },
  {
    id: "K8S_NO_NAMESPACE",
    title: "Resource missing namespace",
    severity: "low",
    category: "maintainability",
    tags: ["namespace"],
    autoFixable: false,
    check(input) {
      return { issues: resources(input).filter((r) => !r.metadata.namespace).map((resource) => issue(input, `${resource.kind} ${resource.metadata.name ?? ""} uses the default namespace.`, "Implicit namespaces make ownership and promotion between environments harder.", "Specify metadata.namespace explicitly.", "metadata:\n  name: app", "metadata:\n  name: app\n  namespace: production")) };
    }
  },
  {
    id: "K8S_PRIVILEGED_CONTAINER",
    title: "Privileged container",
    severity: "critical",
    category: "security",
    tags: ["security-context"],
    autoFixable: false,
    check(input) {
      return { issues: resources(input).flatMap((resource) => pods(resource).filter((c) => c.securityContext?.privileged === true).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} is privileged.`, "Privileged containers get broad host capabilities and greatly increase compromise impact.", "Remove privileged mode unless absolutely required.", "privileged: true", "securityContext:\n  runAsNonRoot: true"))) };
    }
  },
  {
    id: "K8S_NO_SECURITY_CONTEXT",
    title: "Container missing securityContext",
    severity: "high",
    category: "security",
    tags: ["security-context"],
    autoFixable: true,
    check(input) {
      return { issues: resources(input).filter((r) => workloadKinds.has(r.kind)).flatMap((resource) => pods(resource).filter((c) => !c.securityContext).map((container) => issue(input, `${resource.kind} container ${container.name ?? ""} has no securityContext.`, "A security context makes least-privilege runtime behavior explicit.", "Add runAsNonRoot and readOnlyRootFilesystem where possible.", `name: ${container.name ?? "app"}`, "securityContext:\n  runAsNonRoot: true\n  readOnlyRootFilesystem: true", true))) };
    }
  },
  {
    id: "K8S_NO_LABELS",
    title: "Resource missing labels",
    severity: "low",
    category: "maintainability",
    tags: ["labels"],
    autoFixable: true,
    check(input) {
      return { issues: resources(input).filter((r) => Object.keys(resourceLabels(r)).length === 0).map((resource) => issue(input, `${resource.kind} ${resource.metadata.name ?? ""} has no labels.`, "Labels power selection, ownership, dashboards, and cleanup automation.", "Add labels for app, version, and environment.", "metadata:\n  name: app", "metadata:\n  labels:\n    app: app\n    environment: production", true)) };
    }
  },
  {
    id: "K8S_SERVICE_PORT_MISMATCH",
    title: "Service targetPort does not match selected pods",
    severity: "critical",
    category: "reliability",
    tags: ["service"],
    autoFixable: false,
    check(input) {
      const parsed = resources(input);
      const workloads = parsed.filter((r) => controllerKinds.has(r.kind));
      const issues = parsed.filter((r) => r.kind === "Service").flatMap((service) => {
        const selector = ((service.spec as AnyMap).selector ?? {}) as AnyMap;
        const selected = workloads.filter((w) => Object.entries(selector).every(([k, v]) => ((w.spec as AnyMap).template?.metadata?.labels ?? {})[k] === v));
        const ports = selected.flatMap((w) => pods(w).flatMap((c) => c.ports?.map((p: AnyMap) => p.containerPort) ?? []));
        return (((service.spec as AnyMap).ports ?? []) as AnyMap[])
          .filter((p) => p.targetPort && ports.length > 0 && !ports.includes(p.targetPort))
          .map((p) => issue(input, `Service targetPort ${p.targetPort} does not match selected container ports.`, "Traffic sent to a wrong targetPort will fail even though the Service exists.", "Set targetPort to a real containerPort.", `targetPort: ${p.targetPort}`, `targetPort: ${ports[0]}`));
      });
      return { issues };
    }
  },
  {
    id: "K8S_NO_POD_DISRUPTION_BUDGET",
    title: "Highly available workload has no PodDisruptionBudget",
    severity: "info",
    category: "reliability",
    tags: ["availability"],
    autoFixable: false,
    check(input) {
      const parsed = resources(input);
      if (parsed.some((r) => r.kind === "PodDisruptionBudget")) return { issues: [] };
      return { issues: parsed.filter((r) => r.kind === "Deployment" && ((r.spec as AnyMap).replicas ?? 1) >= 2).map((resource) => issue(input, `${resource.metadata.name ?? "Deployment"} has replicas but no PodDisruptionBudget.`, "A PDB protects availability during voluntary node maintenance.", "Add a PodDisruptionBudget for production workloads.", "replicas: 3", "kind: PodDisruptionBudget\nspec:\n  minAvailable: 1")) };
    }
  }
];
