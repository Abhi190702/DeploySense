import type { Severity } from "@deploysense/scanner-core";

export interface ErrorPattern {
  id: string;
  pattern: RegExp;
  title: string;
  severity: Severity;
  what: string;
  causes: string[];
  debugCommands: string[];
  fixSteps: string[];
  prevention: string;
  docsUrl?: string;
}

export interface ErrorExplanation {
  pattern: string;
  title: string;
  severity: Severity;
  matchedLine: string;
  lineNumber: number;
  what: string;
  causes: string[];
  debugCommands: string[];
  fixSteps: string[];
  prevention: string;
  docsUrl?: string;
}

export interface LogDoctorResult {
  totalLines: number;
  errorsFound: number;
  unknownErrors: number;
  findings: ErrorExplanation[];
  correlations: LogCorrelation[];
  unknownPatterns: string[];
  summary: string;
}

export interface LogCorrelation {
  id: string;
  title: string;
  severity: Severity;
  evidencePatterns: string[];
  lineNumbers: number[];
  diagnosis: string;
  recommendedPath: string[];
  confidence: number;
}
