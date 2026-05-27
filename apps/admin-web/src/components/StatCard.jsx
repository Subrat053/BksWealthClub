export default function StatCard({ title, value, change, trend }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300">
      <p className="text-sm font-medium text-[#6B7280]">{title}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="text-3xl font-bold text-[#111827]">{value}</h3>

        {change && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              trend === "up"
                ? "border border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]"
                : "border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}