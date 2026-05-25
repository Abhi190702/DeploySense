import { CodeBlock } from "@/components/CodeBlock";

export default function DocsPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400 lg:block">
          {["Getting Started", "CLI Reference", "Web Scanner", "GitHub Action", "Scanner Rules", "Contributing", "Roadmap"].map((item) => <a key={item} className="block py-2 hover:text-cyan-300" href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</a>)}
        </aside>
        <article className="prose prose-invert max-w-none">
          <h1>DeploySense Documentation</h1>
          <h2 id="getting-started">Getting Started</h2>
          <p>Install dependencies, build the workspace, then scan a config file.</p>
          <CodeBlock>{`pnpm install\npnpm build\nnpx deploysense scan Dockerfile`}</CodeBlock>
          <h2 id="cli-reference">CLI Reference</h2>
          <CodeBlock>{`deploysense scan <file-or-path> [--json] [--markdown] [--sarif] [--fail-on high]\ndeploysense doctor <logfile>\ndeploysense list-rules\ndeploysense init\ndeploysense fix Dockerfile --yes`}</CodeBlock>
          <h2 id="web-scanner">Web Scanner</h2>
          <p>The scanner workspace supports Dockerfile, YAML workflows, Kubernetes manifests, Docker Compose, and deployment logs.</p>
          <h2 id="github-action">GitHub Action</h2>
          <CodeBlock>{`- uses: actions/checkout@v4\n- uses: ./packages/github-action\n  with:\n    scan-path: .\n    fail-on: high\n    comment-pr: true`}</CodeBlock>
          <h2 id="scanner-rules">Scanner Rules</h2>
          <p>DeploySense ships 46 configuration rules across security, reliability, performance, cost, maintainability, and CI/CD quality.</p>
          <h2 id="contributing">Contributing</h2>
          <p>Add a rule by creating a Rule object, exporting it from the scanner package, and adding a fixture-driven test.</p>
          <h2 id="roadmap">Roadmap</h2>
          <ul>
            <li>More cloud-native scanners.</li>
            <li>Persistent report storage.</li>
            <li>VS Code marketplace release.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
