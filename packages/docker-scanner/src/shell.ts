export type ShellCommand = readonly [command: string, subcommand?: string];

const shellCommandSeparators = new Set([";", "&", "|", "(", ")"]);

export function shellWords(source: string): string[] {
  const words: string[] = [];
  let current = "";
  let quote: "'" | "\"" | undefined;
  let escaping = false;

  for (const char of source) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) quote = undefined;
      else current += char;
      continue;
    }

    if (char === "'" || char === "\"") {
      quote = char;
      continue;
    }

    if (isShellWhitespace(char) || isShellSeparator(char)) {
      pushCurrent();
      if (isShellSeparator(char)) words.push(char);
      continue;
    }

    current += char;
  }

  pushCurrent();
  return words;

  function pushCurrent() {
    if (!current) return;
    words.push(current);
    current = "";
  }
}

export function hasAnyShellCommand(source: string, commands: readonly ShellCommand[]): boolean {
  const words = shellWords(source).map((word) => word.toLowerCase());
  return commands.some(([command, subcommand]) => hasCommand(words, command.toLowerCase(), subcommand?.toLowerCase()));
}

export function hasShellOption(source: string, option: string): boolean {
  return shellWords(source).some((word) => word.toLowerCase() === option.toLowerCase());
}

export function hasShellToken(source: string, token: string): boolean {
  return shellWords(source).some((word) => word === token);
}

export function hasAptListCleanup(source: string): boolean {
  const words = shellWords(source);
  const lowered = words.map((word) => word.toLowerCase());

  for (let index = 0; index < lowered.length - 2; index += 1) {
    if (lowered[index] !== "rm") continue;
    if (!lowered.slice(index + 1, index + 3).includes("-rf")) continue;
    if (words.slice(index + 1, index + 4).includes("/var/lib/apt/lists/*")) return true;
  }

  return false;
}

export function hasDownloadPipedToShell(source: string): boolean {
  const words = shellWords(source).map((word) => word.toLowerCase());

  for (let index = 0; index < words.length; index += 1) {
    if (words[index] !== "|") continue;
    const beforePipe = words.slice(0, index);
    const nextCommand = nextExecutable(words, index + 1);
    if (!nextCommand) continue;
    if (!["sh", "bash", "ash"].includes(nextCommand)) continue;
    if (beforePipe.includes("curl") || beforePipe.includes("wget")) return true;
  }

  return false;
}

export function beginsWithShellCommand(source: string, command: ShellCommand): boolean {
  const words = shellWords(source).map((word) => word.toLowerCase()).filter((word) => !shellCommandSeparators.has(word));
  if (words[0] !== command[0].toLowerCase()) return false;
  return command[1] ? words[1] === command[1].toLowerCase() : true;
}

export function replaceFirstShellCommand(source: string, command: ShellCommand, replacement: string): string {
  const words = shellWords(source);
  const lower = words.map((word) => word.toLowerCase());
  const commandIndex = commandIndexOf(lower, command[0].toLowerCase(), command[1]?.toLowerCase());
  if (commandIndex === -1) return source;

  const commandText = command[1] ? `${words[commandIndex]} ${words[commandIndex + 1]}` : words[commandIndex];
  const textIndex = source.toLowerCase().indexOf(commandText.toLowerCase());
  if (textIndex === -1) return source;
  return `${source.slice(0, textIndex)}${replacement}${source.slice(textIndex + commandText.length)}`;
}

export function firstShellWord(source: string): string | undefined {
  return shellWords(source).find((word) => !shellCommandSeparators.has(word));
}

function hasCommand(words: string[], command: string, subcommand?: string): boolean {
  return commandIndexOf(words, command, subcommand) !== -1;
}

function commandIndexOf(words: string[], command: string, subcommand?: string): number {
  for (let index = 0; index < words.length; index += 1) {
    if (words[index] !== command) continue;
    if (!subcommand) return index;
    if (words[index + 1] === subcommand) return index;
  }
  return -1;
}

function nextExecutable(words: string[], start: number): string | undefined {
  for (let index = start; index < words.length; index += 1) {
    const word = words[index];
    if (shellCommandSeparators.has(word)) continue;
    return word;
  }
  return undefined;
}

function isShellWhitespace(char: string): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function isShellSeparator(char: string): boolean {
  return char === ";" || char === "&" || char === "|" || char === "(" || char === ")";
}
