export function GradeDisplay({ grade }: { grade: string }) {
  const color = grade === "A" || grade === "B" ? "text-emerald-300" : grade === "C" ? "text-yellow-200" : grade === "D" ? "text-orange-300" : "text-red-300";
  return <div className={`text-7xl font-black leading-none ${color}`}>{grade}</div>;
}
