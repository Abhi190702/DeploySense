export interface DockerInstruction {
  instruction: string;
  arguments: string;
  lineNumber: number;
  raw: string;
}

export interface ParsedDockerfile {
  instructions: DockerInstruction[];
  from: DockerInstruction[];
  run: DockerInstruction[];
  copy: DockerInstruction[];
  env: DockerInstruction[];
  user: DockerInstruction[];
  workdir: DockerInstruction[];
  expose: DockerInstruction[];
  healthcheck: DockerInstruction[];
  cmd: DockerInstruction[];
  entrypoint: DockerInstruction[];
}

const known = new Set(["FROM", "RUN", "COPY", "ADD", "ENV", "USER", "WORKDIR", "EXPOSE", "HEALTHCHECK", "CMD", "ENTRYPOINT"]);

export function parseDockerfile(content: string): ParsedDockerfile {
  const instructions: DockerInstruction[] = [];
  const physical = content.split(/\r?\n/);
  let logical = "";
  let startLine = 0;

  for (let i = 0; i < physical.length; i += 1) {
    const raw = physical[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!logical) startLine = i + 1;
    logical += logical ? ` ${trimmed}` : trimmed;
    if (trimmed.endsWith("\\")) {
      logical = logical.slice(0, -1).trimEnd();
      continue;
    }
    const match = logical.match(/^([A-Za-z]+)\s+(.*)$/);
    if (match && known.has(match[1].toUpperCase())) {
      instructions.push({
        instruction: match[1].toUpperCase(),
        arguments: match[2].trim(),
        lineNumber: startLine,
        raw: logical
      });
    }
    logical = "";
  }

  const byName = (name: string) => instructions.filter((item) => item.instruction === name);
  return {
    instructions,
    from: byName("FROM"),
    run: byName("RUN"),
    copy: byName("COPY"),
    env: byName("ENV"),
    user: byName("USER"),
    workdir: byName("WORKDIR"),
    expose: byName("EXPOSE"),
    healthcheck: byName("HEALTHCHECK"),
    cmd: byName("CMD"),
    entrypoint: byName("ENTRYPOINT")
  };
}
