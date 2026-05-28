"use client";

import { motion } from "framer-motion";

export function ScoreRing({ score }: { score: number }) {
  const radius       = 54;
  const circumference = 2 * Math.PI * radius;
  const isGood = score >= 80;

  const color =
    isGood            ? "#34d399"
    : score >= 60     ? "#eab308"
    : score >= 40     ? "#f97316"
    : "#ef4444";

  return (
    <div className={`relative h-36 w-36 ${isGood ? "score-glow-pulse" : ""}`}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#27272a"
          strokeWidth="12"
          fill="none"
        />
        {/* Animated fill */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-zinc-400">/100</span>
      </div>
    </div>
  );
}
