import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export default function ContributePage() {
  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-black">Help build the best open-source DevOps tool</h1>
        <p className="mt-5 max-w-3xl text-lg text-zinc-300">DeploySense is intentionally rule-driven and contributor-friendly. New rules are small, testable, and immediately useful to real teams.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Pick a rule idea", "Add parser/rule tests", "Open a focused PR"].map((item, index) => (
            <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-3xl font-bold text-cyan-300">{index + 1}</div>
              <h2 className="mt-3 font-semibold">{item}</h2>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-2xl font-bold">Rule quickstart</h2>
        <CodeBlock>{`export const myRule: Rule = {\n  id: "DOCKER_MY_RULE",\n  title: "Detect something risky",\n  severity: "medium",\n  category: "reliability",\n  check(input) {\n    return { issues: [] };\n  }\n};`}</CodeBlock>
        <div className="mt-8 flex gap-3">
          <Link href="/docs" className="rounded bg-cyan-400 px-4 py-2 font-semibold text-zinc-950">Read docs</Link>
          <a href="https://github.com/Abhi190702/DeploySense" className="rounded border border-zinc-700 px-4 py-2">Open GitHub</a>
        </div>
      </div>
    </div>
  );
}
