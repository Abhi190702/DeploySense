import YAML from "yaml";

export interface ParsedK8sResource {
  apiVersion?: string;
  kind: string;
  metadata: Record<string, unknown>;
  spec: Record<string, unknown>;
  documentIndex: number;
}

export function parseKubernetes(content: string): ParsedK8sResource[] {
  return YAML.parseAllDocuments(content)
    .map((doc, documentIndex) => ({ value: doc.toJSON() as Record<string, unknown> | null, documentIndex }))
    .filter((doc): doc is { value: Record<string, unknown>; documentIndex: number } => Boolean(doc.value?.kind))
    .map(({ value, documentIndex }) => ({
      apiVersion: value.apiVersion as string | undefined,
      kind: value.kind as string,
      metadata: (value.metadata ?? {}) as Record<string, unknown>,
      spec: (value.spec ?? {}) as Record<string, unknown>,
      documentIndex
    }));
}
