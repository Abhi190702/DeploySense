export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type FixFeasibility = "high" | "medium" | "low" | "manual";
export type FalsePositiveRisk = "low" | "medium" | "high";

export type RiskCategory =
  | "security"
  | "reliability"
  | "performance"
  | "cost"
  | "maintainability"
  | "cicd_quality";

export type ScannerTool =
  | "dockerfile"
  | "github-actions"
  | "kubernetes"
  | "compose"
  | "logs";

export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  category: RiskCategory;
  file: string;
  line?: number;
  column?: number;
  message: string;
  why: string;
  fix: string;
  badExample?: string;
  goodExample?: string;
  diffPreview?: string;
  docsUrl?: string;
  tags?: string[];
  confidence?: number; // 0-1, where 1 means high confidence.
  fixFeasibility?: FixFeasibility;
  falsePositiveRisk?: FalsePositiveRisk;
  evidence?: string[];
  autoFixable: boolean;
}

export interface ScanSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface CategoryScore {
  security: number;
  reliability: number;
  performance: number;
  cost: number;
  maintainability: number;
  cicd_quality: number;
}

export interface ScanResult {
  tool: ScannerTool;
  file: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "needs_improvement" | "poor" | "critical";
  categoryScores: CategoryScore;
  summary: ScanSummary;
  issues: Issue[];
  scanDurationMs: number;
  timestamp: string;
  scanId?: string;
}

export interface ProjectReport {
  overallScore: number;
  overallGrade: "A" | "B" | "C" | "D" | "F";
  scanResults: ScanResult[];
  totalIssues: number;
  topIssues: Issue[];
  recommendations: string[];
  architecture?: ArchitectureGraph;
  timestamp: string;
  projectPath: string;
}

export type ArchitectureNodeType =
  | "pipeline"
  | "image"
  | "dockerfile"
  | "workload"
  | "service"
  | "ingress"
  | "compose-service"
  | "config";

export interface ArchitectureNode {
  id: string;
  type: ArchitectureNodeType;
  label: string;
  file: string;
  metadata?: Record<string, string | number | boolean | string[]>;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  type: "builds" | "deploys" | "routes" | "depends_on" | "uses_image" | "exposes" | "references";
  label: string;
  confidence: number;
}

export interface ArchitectureInsight {
  id: string;
  title: string;
  severity: Severity;
  category: RiskCategory;
  message: string;
  files: string[];
  fix: string;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  insights: ArchitectureInsight[];
  summary: {
    pipelines: number;
    images: number;
    workloads: number;
    services: number;
    exposedEndpoints: number;
    linkedSystems: number;
  };
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  category: RiskCategory;
  tags?: string[];
  autoFixable?: boolean;
  check(input: RuleInput): RuleOutput;
}

export interface RuleInput {
  content: string;
  filePath: string;
  lines: string[];
  parsed?: unknown;
  context?: Record<string, unknown>;
}

export interface RuleOutput {
  issues: Omit<Issue, "id" | "title" | "severity" | "category">[];
}

export interface RuleMetadata {
  id: string;
  title: string;
  severity: Severity;
  category: RiskCategory;
  tags: string[];
  autoFixable: boolean;
}
