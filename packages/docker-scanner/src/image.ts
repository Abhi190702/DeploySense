import { shellWords } from "./shell";

export interface DockerImageRef {
  image: string;
  repository: string;
  tag?: string;
  digest?: string;
}

export function parseFromImage(argumentsText: string): DockerImageRef | undefined {
  const words = shellWords(argumentsText);
  let index = 0;

  while (index < words.length) {
    const word = words[index];
    if (!word.startsWith("--")) break;
    index += word.includes("=") ? 1 : 2;
  }

  const image = words[index];
  if (!image || image.toLowerCase() === "as") return undefined;
  return parseImageRef(image);
}

export function parseImageRef(image: string): DockerImageRef {
  const digestIndex = image.indexOf("@");
  const withoutDigest = digestIndex === -1 ? image : image.slice(0, digestIndex);
  const digest = digestIndex === -1 ? undefined : image.slice(digestIndex + 1);
  const lastSlash = withoutDigest.lastIndexOf("/");
  const lastColon = withoutDigest.lastIndexOf(":");
  const hasTag = lastColon > lastSlash;
  const repository = hasTag ? withoutDigest.slice(0, lastColon) : withoutDigest;
  const tag = hasTag ? withoutDigest.slice(lastColon + 1) : undefined;
  return { image, repository, tag, digest };
}

export function usesLatestTag(argumentsText: string): boolean {
  return parseFromImage(argumentsText)?.tag?.toLowerCase() === "latest";
}

export function hasSha256Digest(argumentsText: string): boolean {
  const digest = parseFromImage(argumentsText)?.digest?.toLowerCase();
  return Boolean(digest?.startsWith("sha256:") && digest.length === "sha256:".length + 64 && isHex(digest.slice("sha256:".length)));
}

export function isLargeLinuxBase(argumentsText: string): boolean {
  const ref = parseFromImage(argumentsText);
  if (!ref) return false;
  const base = ref.repository.slice(ref.repository.lastIndexOf("/") + 1).toLowerCase();
  const tag = ref.tag?.toLowerCase() ?? "";
  return ["ubuntu", "debian", "centos"].includes(base) && !tag.includes("slim") && !tag.includes("alpine");
}

export function looksBuildHeavyBase(argumentsText: string): boolean {
  const ref = parseFromImage(argumentsText);
  if (!ref) return false;
  const base = ref.repository.toLowerCase();
  return ["node", "openjdk", "maven", "gradle", "eclipse-temurin"].some((name) => base.includes(name));
}

export function replaceLatestTag(raw: string, replacementTag: string): string {
  const lower = raw.toLowerCase();
  const index = lower.indexOf(":latest");
  if (index === -1) return raw;
  return `${raw.slice(0, index)}:${replacementTag}${raw.slice(index + ":latest".length)}`;
}

function isHex(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    const digit = code >= 48 && code <= 57;
    const lower = code >= 97 && code <= 102;
    if (!digit && !lower) return false;
  }
  return true;
}
