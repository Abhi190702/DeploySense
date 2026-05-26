export interface DockerInstruction {
  instruction: string;
  arguments: string;
  lineNumber: number;
  raw: string;
  flags: string[];
  stageIndex?: number;
}

export interface ParsedDockerfile {
  instructions: DockerInstruction[];
  from: DockerInstruction[];
  run: DockerInstruction[];
  copy: DockerInstruction[];
  add: DockerInstruction[];
  env: DockerInstruction[];
  arg: DockerInstruction[];
  label: DockerInstruction[];
  user: DockerInstruction[];
  workdir: DockerInstruction[];
  expose: DockerInstruction[];
  healthcheck: DockerInstruction[];
  cmd: DockerInstruction[];
  entrypoint: DockerInstruction[];
  shell: DockerInstruction[];
  volume: DockerInstruction[];
}

const known = new Set(["FROM", "RUN", "COPY", "ADD", "ENV", "ARG", "LABEL", "USER", "WORKDIR", "EXPOSE", "HEALTHCHECK", "CMD", "ENTRYPOINT", "SHELL", "VOLUME", "STOPSIGNAL", "ONBUILD"]);

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
      const instruction = match[1].toUpperCase();
      instructions.push({
        instruction,
        arguments: match[2].trim(),
        lineNumber: startLine,
        raw: logical,
        flags: parseFlags(match[2]),
        stageIndex: instruction === "FROM" ? instructions.filter((item) => item.instruction === "FROM").length : undefined
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
    add: byName("ADD"),
    env: byName("ENV"),
    arg: byName("ARG"),
    label: byName("LABEL"),
    user: byName("USER"),
    workdir: byName("WORKDIR"),
    expose: byName("EXPOSE"),
    healthcheck: byName("HEALTHCHECK"),
    cmd: byName("CMD"),
    entrypoint: byName("ENTRYPOINT"),
    shell: byName("SHELL"),
    volume: byName("VOLUME")
  };
}

function parseFlags(argumentsText: string): string[] {
  return splitWhitespace(argumentsText)
    .filter((part) => part.startsWith("--"))
    .map((part) => {
      const valueSeparator = part.indexOf("=");
      return valueSeparator === -1 ? part : part.slice(0, valueSeparator);
    });
}

function splitWhitespace(value: string): string[] {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) parts.push(current);
  return parts;
}
