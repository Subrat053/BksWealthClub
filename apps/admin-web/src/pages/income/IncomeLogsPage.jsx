import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { adminIncomeService } from "../../services/adminIncome.service";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_OPTIONS = {
  "": "All Types",
  RB_INCOME: "Rebirth Wallet",
  SPONSOR_INCOME: "Sponsor Income",
  LEVEL_INCOME: "Level Income",
  COMPANY_FUND: "Company Fund",
  ADMIN_FUND: "Admin Fund",
  ACHIEVER_FUND: "Achiever Fund",
  LEFTOVER_TO_COMPANY: "Leftover → Company",
};

function TypeBadge({ type }) {
  const colors = {
    RB_INCOME: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
    SPONSOR_INCOME: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    LEVEL_INCOME: "bg-teal-400/15 text-teal-300 border-teal-400/30",
    COMPANY_FUND: "bg-blue-400/15 text-blue-300 border-blue-400/30",
    ADMIN_FUND: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    ACHIEVER_FUND: "bg-purple-400/15 text-purple-300 border-purple-400/30",
    LEFTOVER_TO_COMPANY: "bg-orange-400/15 text-orange-300 border-orange-400/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[type] || "bg-slate-400/15 text-slate-300 border-slate-400/30"}`}
    >
      {TYPE_OPTIONS[type] || type}
    </span>
  );
}

export default function IncomeLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminIncomeService.getIncomeLogs({
        page,
        limit: 40,
        type: filters.type || undefined,
      });
      const data = res?.data || {};
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch income logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Income Logs"
        subtitle="Complete audit trail of all income distribution transactions."
      />

      {/* Filters */}
      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:grid-cols-5">
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ type: e.target.value });
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        >
          {Object.entries(TYPE_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center text-xs text-slate-400 lg:col-span-4">
          Total: <span className="ml-1 font-semibold text-white">{total}</span> transactions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                {["Date", "From User", "Receiver", "Type", "Level", "Amount", "Remarks", "Status"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading income logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No income logs found.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item._id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="font-mono text-cyan-300">{item.fromUserId?.memberId || "—"}</span>
                      {item.fromUserId?.fullName && (
                        <span className="ml-1 text-xs text-slate-400">({item.fromUserId.fullName})</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {item.userId ? (
                        <>
                          <span className="font-mono text-emerald-300">{item.userId?.memberId || "—"}</span>
                          {item.userId?.fullName && (
                            <span className="ml-1 text-xs text-slate-400">({item.userId.fullName})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Superadmin</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><TypeBadge type={item.type} /></td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {item.level ? `L${item.level}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-emerald-300">${item.amount}</td>
                    <td className="px-5 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={item.remarks}>
                      {item.remarks || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
