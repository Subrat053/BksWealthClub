import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { adminIncomeService } from "../../services/adminIncome.service";
import DownloadReportButton from "../../components/common/DownloadReportButton";

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
    RB_INCOME: "bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold",
    SPONSOR_INCOME: "bg-emerald-50 text-emerald-700 border-emerald-250 font-semibold",
    LEVEL_INCOME: "bg-teal-50 text-teal-700 border-teal-200 font-semibold",
    COMPANY_FUND: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    ADMIN_FUND: "bg-amber-50 text-[#F59E0B] border-amber-200 font-semibold",
    ACHIEVER_FUND: "bg-purple-50 text-purple-700 border-purple-200 font-semibold",
    LEFTOVER_TO_COMPANY: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
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
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-5">
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ type: e.target.value });
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-805 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition cursor-pointer shadow-sm font-semibold"
        >
          {Object.entries(TYPE_OPTIONS).map(([k, v]) => (
            <option key={k} value={k} className="bg-white">{v}</option>
          ))}
        </select>
        <div className="flex items-center justify-end lg:col-span-4 font-semibold text-slate-600">
          <DownloadReportButton
            data={logs}
            fileName={filters.type ? `${filters.type.toLowerCase()}-report` : "income-logs-report"}
            sheetName="Income Logs"
            columns={[
              { header: "Date", key: "createdAt", format: "date" },
              { header: "From Member ID", key: "fromUserId.memberId" },
              { header: "From Name", key: "fromUserId.fullName" },
              { header: "Receiver Member ID", key: "userId.memberId" },
              { header: "Receiver Name", key: "userId.fullName" },
              { header: "Type", key: "type" },
              { header: "Level", key: "level" },
              { header: "Amount", key: "amount" },
              { header: "Remarks", key: "remarks" },
              { header: "Status", key: "status" },
            ]}
          />
          <div className="ml-4 text-xs text-slate-500 font-semibold">
            Total: <span className="font-extrabold text-[#E8A13F] text-sm">{total}</span> transactions
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Date", "From User", "Receiver", "Type", "Level", "Amount", "Remarks", "Status"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
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
                  <tr key={item._id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-xs text-slate-550 font-medium">{formatDate(item.createdAt).split(",")[0]}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                      <span className="font-mono font-bold text-[#E8A13F]">{item.fromUserId?.memberId || "—"}</span>
                      {item.fromUserId?.fullName && (
                        <span className="ml-1 text-xs text-slate-400 font-semibold">({item.fromUserId.fullName})</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                      {item.userId ? (
                        <>
                          <span className="font-mono font-bold text-[#E8A13F]">{item.userId?.memberId || "—"}</span>
                          {item.userId?.fullName && (
                            <span className="ml-1 text-xs text-slate-400 font-semibold">({item.userId.fullName})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Superadmin</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><TypeBadge type={item.type} /></td>
                    <td className="px-5 py-4 text-sm text-slate-600 font-bold">
                      {item.level ? `L${item.level}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">${item.amount}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate" title={item.remarks}>
                      {item.remarks || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full border border-emerald-250 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
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
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 bg-slate-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
