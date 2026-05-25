import { nanoid } from "nanoid";
import type { ScanResult } from "@deploysense/scanner-core";

interface StoredScan {
  scanId: string;
  result: ScanResult;
  createdAt: number;
  shareToken?: string;
  sharedAt?: number;
}

const scans = new Map<string, StoredScan>();
const shares = new Map<string, string>();
const maxEntries = 1000;
const scanTtlMs = 24 * 60 * 60 * 1000;
const shareTtlMs = 7 * 24 * 60 * 60 * 1000;

export function storeScan(result: ScanResult): ScanResult & { scanId: string } {
  prune();
  const scanId = nanoid(8);
  const stored = { ...result, scanId };
  scans.set(scanId, { scanId, result: stored, createdAt: Date.now() });
  while (scans.size > maxEntries) {
    const oldest = scans.keys().next().value;
    if (!oldest) break;
    scans.delete(oldest);
  }
  return stored;
}

export function getScan(scanId: string): ScanResult | undefined {
  prune();
  return scans.get(scanId)?.result;
}

export function recentScans(): ScanResult[] {
  prune();
  return Array.from(scans.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10)
    .map((item) => item.result);
}

export function shareScan(scanId: string): string | undefined {
  const item = scans.get(scanId);
  if (!item) return undefined;
  const shareToken = nanoid(10);
  item.shareToken = shareToken;
  item.sharedAt = Date.now();
  shares.set(shareToken, scanId);
  return shareToken;
}

export function getSharedScan(token: string): ScanResult | undefined {
  prune();
  const scanId = shares.get(token);
  return scanId ? scans.get(scanId)?.result : undefined;
}

function prune() {
  const now = Date.now();
  for (const [scanId, item] of scans) {
    const sharedExpired = item.sharedAt && now - item.sharedAt > shareTtlMs;
    const scanExpired = now - item.createdAt > scanTtlMs && !item.shareToken;
    if (sharedExpired || scanExpired) {
      scans.delete(scanId);
      if (item.shareToken) shares.delete(item.shareToken);
    }
  }
}
