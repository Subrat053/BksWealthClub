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
  if (normalized === "active" || normalized === "in queue") return "text-cyan-300 border-cyan-500/20 bg-cyan-500/10";
  return "text-slate-300 border-white/10 bg-white/5";
};

export default function AliasRebirthTable({ rebirths = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_28px_rgba(5,10,35,0.25)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Rebirth Details</h3>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Queue serials and actual placement parent</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              <th className="px-3 py-3">Rebirth ID</th>
              <th className="px-3 py-3">Level / Round</th>
              <th className="px-3 py-3">Parent Node</th>
              <th className="px-3 py-3">Children Count</th>
              <th className="px-3 py-3">Child Codes</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Completed At</th>
              <th className="px-3 py-3">Queue Serial No</th>
              <th className="px-3 py-3">Queue Entered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rebirths.map((rebirth) => (
              <tr key={rebirth._id || rebirth.rebirthCode} className="text-slate-200">
                <td className="px-3 py-3 font-mono text-cyan-300">{rebirth.rebirthCode}</td>
                <td className="px-3 py-3">L{rebirth.level} / S{rebirth.sequence}</td>
                <td className="px-3 py-3 font-mono text-slate-300">
                  {rebirth.parentNodeId?.nodeCode || rebirth.parentCode || "None"}
                </td>
                <td className="px-3 py-3">{rebirth.childrenCount ?? 0}</td>
                <td className="px-3 py-3 text-xs text-slate-400">
                  {(rebirth.childCodes || []).length > 0 ? rebirth.childCodes.join(", ") : "-"}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusClass(rebirth.status)}`}>
                    {rebirth.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-400">{formatDate(rebirth.completedAt)}</td>
                <td className="px-3 py-3 text-xs text-slate-300">{rebirth.queueSerialNo ?? "-"}</td>
                <td className="px-3 py-3 text-xs text-slate-300">{formatDate(rebirth.queueEnteredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}