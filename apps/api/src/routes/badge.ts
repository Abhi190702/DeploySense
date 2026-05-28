import { Router, Request, Response, IRouter } from "express";

export const badgeRouter: IRouter = Router();

/* ── Security: sanitize all user-supplied strings going into SVG ── */

/**
 * Escape characters that are dangerous in SVG/XML attribute values and content.
 * Prevents XSS (CWE-79, CodeQL js/xss-through-dom, js/reflected-xss).
 */
function escapeXml(raw: string): string {
  return raw
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;")
    .replace(/`/g,  "&#96;");
}

/**
 * Validate a GitHub username: alphanumeric + hyphens, 1–39 chars, no leading/trailing hyphen.
 * Returns sanitized value or null if invalid.
 */
function validateUsername(raw: string): string | null {
  const cleaned = raw.trim().slice(0, 39);
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(cleaned) && !/^[a-zA-Z0-9]$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function secondsUntilUTCMidnight(): number {
  const now      = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

interface DayData {
  date: string;
  count: number;
}

/* ── SVG renderer ────────────────────────────────────────────── */

const W    = 600;
const H    = 200;
const FONT = "'JetBrains Mono', 'Courier New', monospace";
const BOTTOM_Y = 160;

function buildContributionSVG(
  username: string,    // Already validated — only alphanumeric + hyphens
  days: DayData[],
  total: number,
  peak: number,
  streak: number
): string {
  const MAX_H   = 80;
  const safeLen = Math.max(1, days.length);
  const STEP    = Math.floor((W - 20) / safeLen);
  const LEFT    = Math.floor((W - STEP * safeLen) / 2);
  const cubeW   = Math.max(4, STEP - 1);
  const halfW   = Math.floor(cubeW / 2);
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  // All values here are numbers derived from GitHub API — safe to interpolate
  let bars = "";
  days.forEach((day, i) => {
    const isEmpty  = day.count === 0;
    const stackPx  = isEmpty ? 0 : Math.max(4, Math.round((day.count / maxCount) * MAX_H));
    const cx       = LEFT + i * STEP + halfW;
    const x        = cx - halfW + 1;
    const bw       = cubeW - 2;

    if (isEmpty) {
      bars += `<rect x="${x}" y="${BOTTOM_Y - 4}" width="${bw}" height="4" fill="none" stroke="#27272a" stroke-width="0.8" rx="1"/>`;
    } else {
      bars += `<rect x="${x}" y="${BOTTOM_Y - stackPx}" width="${bw}" height="${stackPx}" fill="url(#bar-grad)" rx="1.5"/>`;
      bars += `<rect x="${x}" y="${BOTTOM_Y - stackPx}" width="${bw}" height="3" fill="#67e8f9" rx="1" opacity="0.9"/>`;
    }
  });

  // Horizontal grid lines — pure numbers
  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const lineY = BOTTOM_Y - Math.round(f * MAX_H);
      return `<line x1="${LEFT}" y1="${lineY}" x2="${W - LEFT}" y2="${lineY}" stroke="#1f1f23" stroke-width="0.5"/>`;
    })
    .join("");

  const ttl = secondsUntilUTCMidnight();
  // Escape the username for safe use in SVG text content and attributes
  const safeUser = escapeXml(username.toUpperCase());
  const safeUserLabel = escapeXml(username);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="DeploySense contribution activity for ${safeUserLabel}">
  <title>DeploySense contributions - ${safeUserLabel}</title>
  <defs>
    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111113"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="scan-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0"/>
      <stop offset="50%" stop-color="#22d3ee" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-grad)" rx="10"/>
  <rect width="${W}" height="${H}" fill="none" stroke="#27272a" stroke-width="1" rx="10"/>
  ${gridLines}
  ${bars}
  <line x1="${LEFT - 2}" y1="${BOTTOM_Y + 1}" x2="${W - LEFT + 2}" y2="${BOTTOM_Y + 1}" stroke="#27272a" stroke-width="0.8"/>
  <text x="14" y="${H - 12}" font-family="${FONT}" font-size="10" fill="#52525b">Streak: <tspan fill="#22d3ee" font-weight="bold">${streak}d</tspan></text>
  <text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#52525b">90d total: <tspan fill="#22d3ee" font-weight="bold">${total}</tspan></text>
  <text x="${W - 14}" y="${H - 12}" text-anchor="end" font-family="${FONT}" font-size="10" fill="#52525b">Peak: <tspan fill="#22d3ee" font-weight="bold">${peak}</tspan></text>
  <text x="14" y="16" font-family="${FONT}" font-size="9" fill="#3f3f46" letter-spacing="1">DEPLOYSENSE - ${safeUser} - LAST 90 DAYS</text>
  <rect width="${W}" height="6" fill="url(#scan-grad)" rx="3">
    <animateTransform attributeName="transform" type="translate" values="0,-6; 0,${H + 6}" dur="6s" repeatCount="indefinite"/>
  </rect>
  <!-- s-maxage=${ttl} -->
</svg>`;
}

function fallbackSVG(message: string, username?: string): string {
  // Both message and username are escaped before SVG injection
  const safeMsg  = escapeXml(message);
  const safeUser = username ? escapeXml(username.toUpperCase()) : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="80" viewBox="0 0 ${W} 80" role="img">
  <title>DeploySense badge</title>
  <rect width="${W}" height="80" fill="#09090b" rx="10"/>
  <rect width="${W}" height="80" fill="none" stroke="#27272a" stroke-width="1" rx="10"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" fill="#52525b" letter-spacing="1">DEPLOYSENSE${safeUser ? ` - ${safeUser}` : ""}</text>
  <text x="${W / 2}" y="52" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" fill="#22d3ee">${safeMsg}</text>
</svg>`;
}

/* ── GitHub GraphQL fetch ────────────────────────────────────── */

const GITHUB_API = "https://api.github.com/graphql";

// GraphQL query — no user input interpolated here. Username is passed as a variable.
const CONTRIB_QUERY = `
query($username: String!, $from: String!, $to: String!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`;

interface GQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{ contributionCount: number; date: string }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

async function fetchContributions(
  username: string,  // Already validated — only [a-zA-Z0-9-]
  token: string
): Promise<{ days: DayData[]; total: number; peak: number; streak: number } | null> {
  const to   = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);

  // username is passed as a GraphQL variable (not interpolated into the query string)
  // so it is safe from GraphQL injection as well
  const resp = await fetch(GITHUB_API, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
      "User-Agent":    "DeploySense-Badge/0.1",
    },
    body: JSON.stringify({
      query: CONTRIB_QUERY,
      variables: { username, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  if (!resp.ok) return null;

  const json = (await resp.json()) as GQLResponse;
  if (json.errors?.length || !json.data?.user) return null;

  const calendar = json.data.user.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  const days: DayData[] = calendar.weeks
    .flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
    .slice(-90);

  const total  = calendar.totalContributions;
  const peak   = Math.max(0, ...days.map((d) => d.count));

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }

  return { days, total, peak, streak };
}

/* ── Route ───────────────────────────────────────────────────── */

badgeRouter.get("/contributions", async (req: Request, res: Response) => {
  // Validate username before any use — prevents XSS and injection
  const rawUser = String(req.query.user ?? "");
  const username = validateUsername(rawUser);

  if (!username) {
    res.status(400).type("image/svg+xml").send(
      fallbackSVG("Invalid or missing ?user= parameter")
    );
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const ttl   = secondsUntilUTCMidnight();

  res.setHeader("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=60`);
  res.setHeader("Content-Type", "image/svg+xml");
  // Prevent the browser from sniffing a different content type
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (!token) {
    res.send(fallbackSVG("Set GITHUB_TOKEN to enable badge", username));
    return;
  }

  try {
    const data = await fetchContributions(username, token);
    if (!data) {
      res.send(fallbackSVG("User not found or rate limited", username));
      return;
    }
    res.send(buildContributionSVG(username, data.days, data.total, data.peak, data.streak));
  } catch {
    res.send(fallbackSVG("Service temporarily unavailable", username));
  }
});
