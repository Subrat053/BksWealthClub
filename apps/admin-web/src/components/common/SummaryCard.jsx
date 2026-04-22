export default function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1c4b] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
