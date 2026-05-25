export function ScannerSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="auto">Auto-detect</option>
      <option value="dockerfile">Dockerfile</option>
      <option value="github-actions">GitHub Actions</option>
      <option value="kubernetes">Kubernetes</option>
      <option value="compose">Docker Compose</option>
    </select>
  );
}
