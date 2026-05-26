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
  const physical = splitLines(content);
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

    const hereDocs = findHereDocDelimiters(logical);
    if (hereDocs.length) {
      const remaining = [...hereDocs];
      while (remaining.length && i + 1 < physical.length) {
        i += 1;
        const bodyLine = physical[i];
        logical += `\n${bodyLine}`;
        if (bodyLine.trim() === remaining[0]) {
          remaining.shift();
        }
      }
    }

    const parsed = parseInstructionLine(logical);
    if (parsed && known.has(parsed.instruction)) {
      instructions.push({
        instruction: parsed.instruction,
        arguments: parsed.arguments,
        lineNumber: startLine,
        raw: logical,
        flags: parseFlags(parsed.arguments),
        stageIndex: parsed.instruction === "FROM" ? instructions.filter((item) => item.instruction === "FROM").length : undefined
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

export function hasDockerHereDoc(content: string): boolean {
  const physical = splitLines(content);
  for (const line of physical) {
    if (findHereDocDelimiters(line).length) return true;
  }
  return false;
}

function parseInstructionLine(value: string): { instruction: string; arguments: string } | undefined {
  let index = 0;
  while (index < value.length && isAsciiLetter(value[index])) {
    index += 1;
  }

  if (index === 0 || index >= value.length || !isWhitespace(value[index])) {
    return undefined;
  }

  const instruction = value.slice(0, index).toUpperCase();
  const argsStart = skipWhitespace(value, index);
  return {
    instruction,
    arguments: value.slice(argsStart).trim()
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

function findHereDocDelimiters(line: string): string[] {
  const delimiters: string[] = [];

  for (let index = 0; index < line.length - 1; index += 1) {
    if (line[index] !== "<" || line[index + 1] !== "<") continue;

    let cursor = index + 2;
    if (line[cursor] === "-") cursor += 1;
    cursor = skipWhitespace(line, cursor);

    const quote = line[cursor] === "'" || line[cursor] === "\"" ? line[cursor] : "";
    if (quote) cursor += 1;

    let delimiter = "";
    while (cursor < line.length) {
      const char = line[cursor];
      if (quote) {
        if (char === quote) break;
        delimiter += char;
        cursor += 1;
        continue;
      }
      if (isWhitespace(char)) break;
      delimiter += char;
      cursor += 1;
    }

    if (delimiter) delimiters.push(delimiter);
  }

  return delimiters;
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

function splitLines(value: string): string[] {
  const lines: string[] = [];
  let current = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
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

function skipWhitespace(value: string, start: number): number {
  let index = start;
  while (index < value.length && isWhitespace(value[index])) {
    index += 1;
  }
  return index;
}

function isWhitespace(char: string | undefined): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function isAsciiLetter(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
