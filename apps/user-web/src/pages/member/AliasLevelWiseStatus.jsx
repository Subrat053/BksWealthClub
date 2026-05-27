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
  if (normalized === "completed") return "text-emerald-700 border-emerald-200 bg-emerald-50";
  if (normalized === "in progress") return "text-[#9A6A1F] border-[#F4B860]/40 bg-[#FFF4E5]";
  return "text-slate-600 border-slate-200 bg-slate-50";
};

export default function AliasLevelWiseStatus({ levelWiseStatus = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Level-wise Status</h3>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alias completion map</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3">Required</th>
              <th className="px-3 py-3">Generated</th>
              <th className="px-3 py-3">Completed</th>
              <th className="px-3 py-3">Pending</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Completed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {levelWiseStatus.map((level) => (
              <tr key={level.level} className="text-slate-700 hover:bg-slate-50 transition">
                <td className="px-3 py-3 font-semibold text-slate-900">{level.level}</td>
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