const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
  if (normalized === "in progress") return "text-amber-300 border-amber-500/20 bg-amber-500/10";
  return "text-slate-300 border-white/10 bg-white/5";
};

export default function AliasLevelWiseStatus({ levelWiseStatus = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_28px_rgba(5,10,35,0.25)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Level-wise Status</h3>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alias completion map</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3">Required</th>
              <th className="px-3 py-3">Generated</th>
              <th className="px-3 py-3">Completed</th>
              <th className="px-3 py-3">Pending</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Completed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {levelWiseStatus.map((level) => (
              <tr key={level.level} className="text-slate-200">
                <td className="px-3 py-3 font-semibold">{level.level}</td>
                <td className="px-3 py-3">{level.requiredCount}</td>
                <td className="px-3 py-3">{level.generatedCount}</td>
                <td className="px-3 py-3">{level.completedCount}</td>
                <td className="px-3 py-3">{level.pendingCount}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusClass(level.status)}`}>
                    {level.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-400">{formatDate(level.completionDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}