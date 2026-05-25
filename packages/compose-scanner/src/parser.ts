import YAML from "yaml";

export interface ParsedComposeService {
  name: string;
  image?: string;
  build?: unknown;
  ports?: unknown[];
  environment?: Record<string, unknown> | string[];
  depends_on?: unknown;
  healthcheck?: unknown;
  restart?: string;
  volumes?: unknown[];
  networks?: unknown;
  privileged?: boolean;
}

export interface ParsedCompose {
  version?: string;
  services: Record<string, ParsedComposeService>;
  volumes?: Record<string, unknown>;
  networks?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export function parseCompose(content: string): ParsedCompose {
  const raw = (YAML.parse(content) ?? {}) as Record<string, unknown>;
  const services = Object.fromEntries(
    Object.entries((raw.services ?? {}) as Record<string, Record<string, unknown>>).map(([name, service]) => [
      name,
      { name, ...service } as ParsedComposeService
    ])
  );
  return {
    version: raw.version as string | undefined,
    services,
    volumes: raw.volumes as Record<string, unknown> | undefined,
    networks: raw.networks as Record<string, unknown> | undefined,
    raw
  };
}
