import type { ArchitectureEdge, ArchitectureGraph, ArchitectureInsight, ArchitectureNode, ScanResult } from "./types";

export interface ArchitectureFile {
  name: string;
  content: string;
}

interface FileFacts {
  name: string;
  lowerName: string;
  lines: string[];
  isDockerfile: boolean;
  isWorkflow: boolean;
  isCompose: boolean;
  isKubernetes: boolean;
}

export function analyzeArchitecture(files: ArchitectureFile[], scanResults: ScanResult[] = []): ArchitectureGraph {
  const facts = files.map(toFacts);
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];
  const insights: ArchitectureInsight[] = [];

  for (const file of facts) {
    if (file.isDockerfile) addDockerfileNodes(file, nodes);
    if (file.isWorkflow) addWorkflowNodes(file, nodes);
    if (file.isKubernetes) addKubernetesNodes(file, nodes, edges);
    if (file.isCompose) addComposeNodes(file, nodes, edges);
  }

  connectPipelines(facts, nodes, edges);
  connectImages(nodes, edges);
  addIssueDrivenInsights(scanResults, insights);
  addGraphInsights(nodes, edges, facts, insights);

  return {
    nodes: uniqueNodes(nodes),
    edges: uniqueEdges(edges),
    insights: uniqueInsights(insights),
    summary: summarize(nodes, edges)
  };
}

function toFacts(file: ArchitectureFile): FileFacts {
  const lowerName = normalizePath(file.name).toLowerCase();
  const lines = splitLines(file.content);
  const isYaml = lowerName.endsWith(".yml") || lowerName.endsWith(".yaml");
  return {
    name: file.name,
    lowerName,
    lines,
    isDockerfile: lowerName.endsWith("dockerfile") || lowerName.endsWith(".dockerfile"),
    isWorkflow: lowerName.includes(".github/workflows/") && isYaml,
    isCompose: isYaml && (lowerName.includes("docker-compose") || lowerName.endsWith("compose.yml") || hasLineStarting(lines, "services:")),
    isKubernetes: isYaml && hasLineStarting(lines, "kind:")
  };
}

function addDockerfileNodes(file: FileFacts, nodes: ArchitectureNode[]) {
  nodes.push({
    id: nodeId("dockerfile", file.name),
    type: "dockerfile",
    label: "Dockerfile",
    file: file.name,
    metadata: {
      baseImages: findDockerBaseImages(file.lines),
      exposedPorts: findInstructionValues(file.lines, "EXPOSE")
    }
  });
}

function addWorkflowNodes(file: FileFacts, nodes: ArchitectureNode[]) {
  nodes.push({
    id: nodeId("pipeline", file.name),
    type: "pipeline",
    label: lastPathPart(file.name),
    file: file.name,
    metadata: {
      buildsImages: file.lines.some((line) => containsAll(line, ["docker", "build"])),
      deploysKubernetes: file.lines.some((line) => containsAny(line, ["kubectl", "helm", "kustomize"]))
    }
  });
}

function addKubernetesNodes(file: FileFacts, nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  let currentKind = "";
  let currentName = "";
  let inMetadata = false;
  const images: string[] = [];
  const ports: string[] = [];

  for (const line of file.lines) {
    const keyValue = parseYamlKeyValue(line);
    if (!keyValue) continue;
    if (keyValue.key === "kind") currentKind = keyValue.value;
    if (keyValue.key === "metadata") inMetadata = true;
    else if (inMetadata && keyValue.key === "name" && !currentName) currentName = keyValue.value;
    else if (inMetadata && indentation(line) === 0) inMetadata = false;
    if (keyValue.key === "image") images.push(cleanYamlScalar(keyValue.value));
    if (keyValue.key === "containerPort" || keyValue.key === "targetPort" || keyValue.key === "port") ports.push(cleanYamlScalar(keyValue.value));
  }

  if (!currentKind) return;
  const id = nodeId(currentKind.toLowerCase(), `${file.name}:${currentName || currentKind}`);
  const type = currentKind.toLowerCase() === "service" ? "service" : currentKind.toLowerCase() === "ingress" ? "ingress" : "workload";
  nodes.push({
    id,
    type,
    label: currentName || currentKind,
    file: file.name,
    metadata: { kind: currentKind, images, ports }
  });

  for (const image of images) {
    const imageNode = imageNodeFor(image, file.name);
    nodes.push(imageNode);
    edges.push({ from: id, to: imageNode.id, type: "uses_image", label: "uses image", confidence: 0.9 });
  }
}

function addComposeNodes(file: FileFacts, nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  let inServices = false;
  let currentService = "";

  for (const line of file.lines) {
    const trimmed = line.trim();
    if (trimmed === "services:") {
      inServices = true;
      continue;
    }
    if (!inServices) continue;
    if (indentation(line) === 2 && trimmed.endsWith(":")) {
      currentService = trimmed.slice(0, -1);
      nodes.push({
        id: nodeId("compose-service", `${file.name}:${currentService}`),
        type: "compose-service",
        label: currentService,
        file: file.name
      });
      continue;
    }
    if (!currentService) continue;
    const keyValue = parseYamlKeyValue(line);
    if (!keyValue) continue;
    const currentId = nodeId("compose-service", `${file.name}:${currentService}`);
    if (keyValue.key === "image") {
      const imageNode = imageNodeFor(cleanYamlScalar(keyValue.value), file.name);
      nodes.push(imageNode);
      edges.push({ from: currentId, to: imageNode.id, type: "uses_image", label: "uses image", confidence: 0.85 });
    }
    if (keyValue.key === "ports") {
      edges.push({ from: currentId, to: currentId, type: "exposes", label: "publishes host port", confidence: 0.75 });
    }
    if (keyValue.key === "depends_on") {
      edges.push({ from: currentId, to: currentId, type: "depends_on", label: "declares dependencies", confidence: 0.65 });
    }
  }
}

function connectPipelines(facts: FileFacts[], nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const pipelines = nodes.filter((node) => node.type === "pipeline");
  const dockerfiles = nodes.filter((node) => node.type === "dockerfile");
  const deployTargets = nodes.filter((node) => node.type === "workload" || node.type === "service" || node.type === "ingress");

  for (const pipeline of pipelines) {
    const source = facts.find((file) => file.name === pipeline.file);
    if (!source) continue;
    if (source.lines.some((line) => containsAll(line, ["docker", "build"]))) {
      for (const dockerfile of dockerfiles) {
        edges.push({ from: pipeline.id, to: dockerfile.id, type: "builds", label: "builds image", confidence: 0.82 });
      }
    }
    if (source.lines.some((line) => containsAny(line, ["kubectl", "helm", "kustomize"]))) {
      for (const target of deployTargets) {
        edges.push({ from: pipeline.id, to: target.id, type: "deploys", label: "deploys manifest", confidence: 0.72 });
      }
    }
  }
}

function connectImages(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const dockerfile = nodes.find((node) => node.type === "dockerfile");
  if (!dockerfile) return;
  for (const image of nodes.filter((node) => node.type === "image")) {
    const label = image.label.toLowerCase();
    const registryHost = imageRegistryHost(label);
    if (!label.includes("/") || registryHost === "localhost" || registryHost === "ghcr.io" || registryHost === "docker.io") {
      edges.push({ from: dockerfile.id, to: image.id, type: "builds", label: "likely build source", confidence: 0.55 });
    }
  }
}

function imageRegistryHost(image: string): string | undefined {
  const slash = image.indexOf("/");
  if (slash === -1) return undefined;
  const firstSegment = image.slice(0, slash);
  if (firstSegment === "localhost" || firstSegment.includes(".") || firstSegment.includes(":")) {
    return firstSegment;
  }
  return undefined;
}

function addIssueDrivenInsights(scanResults: ScanResult[], insights: ArchitectureInsight[]) {
  const allIssues = scanResults.flatMap((result) => result.issues);
  if (allIssues.some((issue) => issue.id.includes("LATEST") || issue.id === "DOCKER_UNPINNED_DIGEST")) {
    insights.push({
      id: "ARCH_MUTABLE_IMAGE_CHAIN",
      title: "Mutable image references weaken deployment rollback",
      severity: "high",
      category: "reliability",
      message: "One or more deployment surfaces use floating tags or unpinned image references.",
      files: uniqueStrings(allIssues.filter((issue) => issue.id.includes("LATEST") || issue.id === "DOCKER_UNPINNED_DIGEST").map((issue) => issue.file)),
      fix: "Pin images to immutable versions or digests across Dockerfiles, Compose, Kubernetes, and CI build outputs."
    });
  }
  if (allIssues.some((issue) => issue.id.includes("SECRET"))) {
    insights.push({
      id: "ARCH_SECRET_EXPOSURE_PATH",
      title: "Secret handling risk crosses build and runtime boundaries",
      severity: "critical",
      category: "security",
      message: "Secrets appear in build or runtime configuration where they can leak into images, logs, or repositories.",
      files: uniqueStrings(allIssues.filter((issue) => issue.id.includes("SECRET")).map((issue) => issue.file)),
      fix: "Move secrets to runtime secret managers and keep credential files out of Docker build contexts."
    });
  }
  if (allIssues.some((issue) => issue.id.includes("NO_HEALTHCHECK") || issue.id.includes("NO_READINESS") || issue.id.includes("NO_LIVENESS"))) {
    insights.push({
      id: "ARCH_WEAK_RUNTIME_HEALTH",
      title: "Runtime health signals are incomplete",
      severity: "high",
      category: "reliability",
      message: "The architecture has containers or workloads without health, readiness, or liveness signals.",
      files: uniqueStrings(allIssues.filter((issue) => issue.id.includes("HEALTH") || issue.id.includes("READINESS") || issue.id.includes("LIVENESS")).map((issue) => issue.file)),
      fix: "Add Docker healthchecks plus Kubernetes readiness and liveness probes that reflect real dependency health."
    });
  }
}

function addGraphInsights(nodes: ArchitectureNode[], edges: ArchitectureEdge[], facts: FileFacts[], insights: ArchitectureInsight[]) {
  const hasRuntime = nodes.some((node) => node.type === "workload" || node.type === "compose-service");
  const hasPipeline = nodes.some((node) => node.type === "pipeline");
  const hasDockerfile = nodes.some((node) => node.type === "dockerfile");

  if (hasRuntime && !hasPipeline) {
    insights.push({
      id: "ARCH_NO_DEPLOYMENT_PIPELINE",
      title: "Runtime config exists without a detected deployment pipeline",
      severity: "medium",
      category: "cicd_quality",
      message: "DeploySense found runtime deployment files but no GitHub Actions workflow that appears to build or deploy them.",
      files: facts.filter((file) => file.isKubernetes || file.isCompose).map((file) => file.name),
      fix: "Add or scan the CI/CD workflow that builds images, runs tests, and deploys these manifests."
    });
  }
  if (hasDockerfile && hasRuntime && !edges.some((edge) => edge.type === "builds" || edge.type === "deploys")) {
    insights.push({
      id: "ARCH_WEAK_FILE_LINKAGE",
      title: "Build and runtime files are weakly linked",
      severity: "medium",
      category: "maintainability",
      message: "Docker and runtime files were found, but DeploySense could not confidently connect build output to deployment input.",
      files: facts.map((file) => file.name),
      fix: "Use consistent image names/tags between CI, Dockerfiles, Compose, and Kubernetes manifests."
    });
  }
}

function summarize(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): ArchitectureGraph["summary"] {
  return {
    pipelines: nodes.filter((node) => node.type === "pipeline").length,
    images: nodes.filter((node) => node.type === "image").length,
    workloads: nodes.filter((node) => node.type === "workload" || node.type === "compose-service").length,
    services: nodes.filter((node) => node.type === "service" || node.type === "ingress").length,
    exposedEndpoints: edges.filter((edge) => edge.type === "exposes" || edge.type === "routes").length,
    linkedSystems: edges.length
  };
}

function findDockerBaseImages(lines: string[]): string[] {
  return lines
    .map((line) => readInstructionValue(line, "FROM"))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.split(" ")[0]);
}

function findInstructionValues(lines: string[], instruction: string): string[] {
  return lines.map((line) => readInstructionValue(line, instruction)).filter((value): value is string => Boolean(value));
}

function readInstructionValue(line: string, instruction: string): string | undefined {
  const trimmed = line.trim();
  if (!startsWithFolded(trimmed, instruction)) return undefined;
  const next = trimmed[instruction.length];
  if (next !== " " && next !== "\t") return undefined;
  return trimmed.slice(instruction.length).trim();
}

function parseYamlKeyValue(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  const colon = trimmed.indexOf(":");
  if (colon <= 0) return undefined;
  const rawKey = trimmed.slice(0, colon).trim();
  const key = rawKey.startsWith("- ") ? rawKey.slice(2).trim() : rawKey;
  return {
    key,
    value: cleanYamlScalar(trimmed.slice(colon + 1).trim())
  };
}

function cleanYamlScalar(value: string): string {
  let result = value.trim();
  if ((result.startsWith("\"") && result.endsWith("\"")) || (result.startsWith("'") && result.endsWith("'"))) {
    result = result.slice(1, -1);
  }
  return result;
}

function imageNodeFor(image: string, file: string): ArchitectureNode {
  return { id: nodeId("image", image), type: "image", label: image, file, metadata: { image } };
}

function nodeId(type: string, value: string): string {
  return `${type}:${normalizePath(value).toLowerCase()}`;
}

function normalizePath(value: string): string {
  return value.split("\\").join("/");
}

function lastPathPart(value: string): string {
  const normalized = normalizePath(value);
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

function splitLines(value: string): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of value) {
    if (char === "\n") {
      lines.push(current.endsWith("\r") ? current.slice(0, -1) : current);
      current = "";
      continue;
    }
    current += char;
  }
  lines.push(current.endsWith("\r") ? current.slice(0, -1) : current);
  return lines;
}

function hasLineStarting(lines: string[], prefix: string): boolean {
  return lines.some((line) => startsWithFolded(line.trim(), prefix));
}

function startsWithFolded(value: string, prefix: string): boolean {
  return value.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase();
}

function indentation(line: string): number {
  let count = 0;
  while (count < line.length && line[count] === " ") count += 1;
  return count;
}

function containsAny(value: string, needles: string[]): boolean {
  const lowered = value.toLowerCase();
  return needles.some((needle) => lowered.includes(needle.toLowerCase()));
}

function containsAll(value: string, needles: string[]): boolean {
  const lowered = value.toLowerCase();
  return needles.every((needle) => lowered.includes(needle.toLowerCase()));
}

function uniqueNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function uniqueEdges(edges: ArchitectureEdge[]): ArchitectureEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.from}->${edge.to}:${edge.type}:${edge.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueInsights(insights: ArchitectureInsight[]): ArchitectureInsight[] {
  const seen = new Set<string>();
  return insights.filter((insight) => {
    if (seen.has(insight.id)) return false;
    seen.add(insight.id);
    return true;
  });
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
