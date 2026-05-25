export function DiffPreview({ diff }: { diff?: string }) {
  if (!diff) return null;
  return (
    <pre className="overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed">
      {diff.split("\n").map((line, index) => (
        <div key={`${line}-${index}`} className={line.startsWith("+") ? "text-emerald-300" : line.startsWith("-") ? "text-red-300" : "text-zinc-300"}>
          {line}
        </div>
      ))}
    </pre>
  );
}
