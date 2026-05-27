export default function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
    </div>
  );
}
