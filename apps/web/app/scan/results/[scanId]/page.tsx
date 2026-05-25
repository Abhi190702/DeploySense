import { ReportTabs } from "@/components/ReportTabs";
import { getScan } from "@/lib/api";

export default async function ScanResultPage({ params }: { params: { scanId: string } }) {
  const result = await getScan(params.scanId);
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-sm text-cyan-300">Saved scan {params.scanId}</p>
        <h1 className="mt-2 text-4xl font-black">{result.file}</h1>
        <ReportTabs result={result} />
      </div>
    </div>
  );
}
