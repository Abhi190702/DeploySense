"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryScore } from "@deploysense/scanner-core";

export function CategoryChart({ scores }: { scores: CategoryScore }) {
  const data = Object.entries(scores).map(([name, score]) => ({ name: name.replace("_", " "), score }));
  return (
    <div className="h-72 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 34 }}>
          <XAxis type="number" domain={[0, 100]} stroke="#a1a1aa" />
          <YAxis dataKey="name" type="category" stroke="#a1a1aa" width={110} />
          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: "#fafafa" }} />
          <Bar dataKey="score" fill="#22d3ee" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
