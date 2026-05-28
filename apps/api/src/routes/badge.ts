import { Router, Request, Response, IRouter } from "express";

export const badgeRouter: IRouter = Router();

/* ── Helpers ─────────────────────────────────────────────────── */

function secondsUntilUTCMidnight(): number {
  const now  = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

interface DayData {
  date: string;
  count: number;
}

/* ── SVG renderer ────────────────────────────────────────────── */

const W   = 600;
const H   = 200;
const FONT = "'JetBrains Mono', 'Courier New', monospace";

// Isometric cube measurements
const CUBE_W  = 10;   // half-width of top diamond
const CUBE_H  = 5;    // height of top diamond
const SIDE_H  = 6;    // height of side faces
const GAP     = 1;    // horizontal gap between cubes
const MAX_STACK = 14; // max visual cube stacks
const BOTTOM_Y  = 160; // baseline Y for cubes

function drawIsoCube(x: number, y: number, stackH: number, isEmpty: boolean): string {
  // top face (parallelogram)
  const tx  = x;
  const ty  = y - stackH;

  if (isEmpty) {
    // Wire frame only — thin outline cube at 4px height
    const ey = y - 4;
    return `
      <!-- wireframe cube -->
      <polygon points="${tx},${ey} ${tx + CUBE_W},${ey - CUBE_H} ${tx + CUBE_W * 2},${ey} ${tx + CUBE_W},${ey + CUBE_H}"
        fill="none" stroke="#27272a" stroke-width="0.8" opacity="0.7"/>
      <polygon points="${tx},${ey} ${tx},${ey + SIDE_H} ${tx + CUBE_W},${ey + SIDE_H + CUBE_H} ${tx + CUBE_W},${ey + CUBE_H}"
        fill="none" stroke="#27272a" stroke-width="0.8" opacity="0.7"/>
      <polygon points="${tx + CUBE_W},${ey + CUBE_H} ${tx + CUBE_W},${ey + CUBE_H + SIDE_H} ${tx + CUBE_W * 2},${ey + SIDE_H} ${tx + CUBE_W * 2},${ey}"
        fill="none" stroke="#27272a" stroke-width="0.8" opacity="0.7"/>
    `;
  }

  const id = `cube-${Math.round(tx)}-${Math.round(ty)}`;
  return `
    <defs>
      <linearGradient id="${id}-top" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#22d3ee"/>
        <stop offset="100%" stop-color="#0891b2"/>
      </linearGradient>
      <linearGradient id="${id}-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0891b2"/>
        <stop offset="100%" stop-color="#0e7490"/>
      </linearGradient>
      <linearGradient id="${id}-right" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#0c4a6e"/>
      </linearGradient>
    </defs>
    <!-- top face -->
    <polygon points="${tx},${ty} ${tx + CUBE_W},${ty - CUBE_H} ${tx + CUBE_W * 2},${ty} ${tx + CUBE_W},${ty + CUBE_H}"
      fill="url(#${id}-top)"/>
    <!-- left face -->
    <polygon points="${tx},${ty} ${tx},${ty + SIDE_H} ${tx + CUBE_W},${ty + SIDE_H + CUBE_H} ${tx + CUBE_W},${ty + CUBE_H}"
      fill="url(#${id}-left)"/>
    <!-- right face -->
    <polygon points="${tx + CUBE_W},${ty + CUBE_H} ${tx + CUBE_W},${ty + CUBE_H + SIDE_H} ${tx + CUBE_W * 2},${ty + SIDE_H} ${tx + CUBE_W * 2},${ty}"
      fill="url(#${id}-right)"/>
  `;
}

function buildContributionSVG(
  username: string,
  days: DayData[],
  total: number,
  peak: number,
  streak: number
): string {
  const MAX_H = 80; // max pixel height for stacks
  const cubeStep = CUBE_W * 2 + GAP;

  // We have 90 days. Available width ~ 580px. cubeStep = 21 → fits 90 at cubeStep=6.4
  // Scale to fit width: left margin 10, right margin 10 → 580 / 90 = ~6.44
  const STEP   = Math.floor((W - 20) / days.length);
  const LEFT   = Math.floor((W - STEP * days.length) / 2);

  const cubeW  = Math.max(4, STEP - 1);
  const halfW  = Math.floor(cubeW / 2);

  let shapes = "";
  let maxCount = Math.max(1, ...days.map((d) => d.count));

  days.forEach((day, i) => {
    const isEmpty = day.count === 0;
    const normalized = isEmpty ? 0 : Math.max(1, Math.round((day.count / maxCount) * MAX_STACK));
    const stackPx = isEmpty ? 0 : Math.max(4, Math.round((day.count / maxCount) * MAX_H));

    const cx = LEFT + i * STEP + halfW;

    // Draw one isometric column
    for (let s = 0; s < (isEmpty ? 1 : normalized); s++) {
      const ty = BOTTOM_Y - s * (CUBE_H + SIDE_H);
      shapes += drawIsoCube(cx - halfW, ty, 0, isEmpty && s === 0);
      if (!isEmpty) break; // just draw one representative cube per column for performance
    }

    // For filled columns, draw a solid rectangle approximation instead (more performant)
    if (!isEmpty) {
      shapes = shapes.slice(0, shapes.lastIndexOf("<!-- top face -->") === -1 ? shapes.length : shapes.lastIndexOf("<!-- top face -->") - 200);
      // Colored bar
      shapes += `
        <rect x="${cx - halfW + 1}" y="${BOTTOM_Y - stackPx}" width="${cubeW - 2}" height="${stackPx}"
          fill="url(#bar-grad)" rx="1.5"/>
        <rect x="${cx - halfW + 1}" y="${BOTTOM_Y - stackPx}" width="${cubeW - 2}" height="3"
          fill="#67e8f9" rx="1" opacity="0.9"/>
      `;
    } else {
      // Zero-contribution: thin outline
      shapes += `
        <rect x="${cx - halfW + 1}" y="${BOTTOM_Y - 4}" width="${cubeW - 2}" height="4"
          fill="none" stroke="#27272a" stroke-width="0.8" rx="1"/>
      `;
    }
  });

  const ttl = secondsUntilUTCMidnight();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="DeploySense contribution activity for ${username}">
  <title>DeploySense contributions — ${username}</title>

  <defs>
    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111113"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg-grad)" rx="10"/>

  <!-- Subtle border -->
  <rect width="${W}" height="${H}" fill="none" stroke="#27272a" stroke-width="1" rx="10"/>

  <!-- Grid lines (horizontal, very faint) -->
  ${[0.25, 0.5, 0.75].map((f) => {
    const lineY = BOTTOM_Y - Math.round(f * 80);
    return `<line x1="${LEFT}" y1="${lineY}" x2="${W - LEFT}" y2="${lineY}" stroke="#1f1f23" stroke-width="0.5"/>`;
  }).join("\n  ")}

  <!-- Contribution bars -->
  ${shapes}

  <!-- Baseline -->
  <line x1="${LEFT - 2}" y1="${BOTTOM_Y + 1}" x2="${W - LEFT + 2}" y2="${BOTTOM_Y + 1}"
    stroke="#27272a" stroke-width="0.8"/>

  <!-- Stats row -->
  <text x="14" y="${H - 12}" font-family="${FONT}" font-size="10" fill="#52525b">
    🔥 Streak: <tspan fill="#22d3ee" font-weight="bold">${streak}d</tspan>
  </text>
  <text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#52525b">
    Contributions (90d): <tspan fill="#22d3ee" font-weight="bold">${total}</tspan>
  </text>
  <text x="${W - 14}" y="${H - 12}" text-anchor="end" font-family="${FONT}" font-size="10" fill="#52525b">
    Peak: <tspan fill="#22d3ee" font-weight="bold">${peak}</tspan>
  </text>

  <!-- Title label -->
  <text x="14" y="16" font-family="${FONT}" font-size="9" fill="#3f3f46" letter-spacing="1">
    DEPLOYSENSE · ${username.toUpperCase()} · LAST 90 DAYS
  </text>

  <!-- Scanline animation -->
  <rect width="${W}" height="6" fill="url(#scan-grad)" rx="3">
    <animateTransform attributeName="transform" type="translate"
      values="0,-6; 0,${H + 6}" dur="6s" repeatCount="indefinite"/>
  </rect>
  <defs>
    <linearGradient id="scan-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0"/>
      <stop offset="50%" stop-color="#22d3ee" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Cache TTL comment for proxies -->
  <!-- Cache-Control: public, s-maxage=${ttl}, stale-while-revalidate=60 -->
</svg>`;
}

function fallbackSVG(message: string, username?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="80" viewBox="0 0 ${W} 80" role="img">
  <title>DeploySense badge</title>
  <rect width="${W}" height="80" fill="#09090b" rx="10"/>
  <rect width="${W}" height="80" fill="none" stroke="#27272a" stroke-width="1" rx="10"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-family="'JetBrains Mono', monospace"
    font-size="11" fill="#52525b" letter-spacing="1">
    DEPLOYSENSE ${username ? `· ${username.toUpperCase()}` : ""}
  </text>
  <text x="${W / 2}" y="52" text-anchor="middle" font-family="'JetBrains Mono', monospace"
    font-size="12" fill="#22d3ee">
    ${message}
  </text>
</svg>`;
}

/* ── GitHub GraphQL fetch ────────────────────────────────────── */

const GITHUB_API = "https://api.github.com/graphql";

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

async function fetchContributions(username: string, token: string): Promise<{
  days: DayData[];
  total: number;
  peak: number;
  streak: number;
} | null> {
  const to   = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);

  const resp = await fetch(GITHUB_API, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
      "User-Agent":    "DeploySense-Badge/0.1",
    },
    body: JSON.stringify({
      query: CONTRIB_QUERY,
      variables: {
        username,
        from: from.toISOString(),
        to:   to.toISOString(),
      },
    }),
  });

  if (!resp.ok) return null;

  const json = (await resp.json()) as GQLResponse;
  if (json.errors?.length || !json.data?.user) return null;

  const calendar = json.data.user.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  const days: DayData[] = calendar.weeks
    .flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
    )
    .slice(-90);

  const total  = calendar.totalContributions;
  const peak   = Math.max(0, ...days.map((d) => d.count));

  // Streak: consecutive days with count > 0 ending at today
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }

  return { days, total, peak, streak };
}

/* ── Route ───────────────────────────────────────────────────── */

badgeRouter.get("/contributions", async (req: Request, res: Response) => {
  const username = String(req.query.user ?? "").trim().slice(0, 39);

  if (!username) {
    res
      .status(400)
      .type("image/svg+xml")
      .send(fallbackSVG("?user= parameter required"));
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const ttl   = secondsUntilUTCMidnight();

  res.setHeader("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=60`);
  res.setHeader("Content-Type", "image/svg+xml");

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
