import type { Metadata } from "next";
import Link from "next/link";
import { ReportTabs } from "@/components/ReportTabs";
import { getShare } from "@/lib/api";

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  try {
    const result = await getShare(params.token);
    return {
      title: `DeploySense Report - Score: ${result.score}/100`,
      description: `${result.summary.high} high, ${result.summary.medium} medium issues found in ${result.file}.`,
      openGraph: {
        title: `DeploySense Report - Score: ${result.score}/100`,
        description: `${result.summary.total} issues found in ${result.file}.`
      }
    };
  } catch {
    return { title: "DeploySense Shared Report" };
  }
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const result = await getShare(params.token);
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-sm text-cyan-300">Shared DeploySense report</p>
        <h1 className="mt-2 text-4xl font-black">{result.file}</h1>
        <ReportTabs result={result} />
        <Link href="/scan" className="mt-8 inline-block rounded bg-cyan-400 px-4 py-2 font-semibold text-zinc-950">Try Scanner</Link>
      </div>
    </div>
  );
}
