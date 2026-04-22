export default function StatCard({ title, value, change, trend }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-medium text-blue-100/70">{title}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="text-3xl font-bold text-white">{value}</h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            trend === "up"
              ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
              : "border border-red-400/20 bg-red-500/15 text-red-300"
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}