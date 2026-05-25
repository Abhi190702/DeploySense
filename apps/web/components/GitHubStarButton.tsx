"use client";

import { useEffect, useState } from "react";

export function GitHubStarButton() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.github.com/repos/Abhi190702/DeploySense")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setStars(data?.stargazers_count ?? null))
      .catch(() => setStars(null));
  }, []);
  return (
    <a href="https://github.com/Abhi190702/DeploySense" className="inline-flex items-center rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-cyan-400">
      GitHub {stars !== null ? `(${stars})` : ""}
    </a>
  );
}
