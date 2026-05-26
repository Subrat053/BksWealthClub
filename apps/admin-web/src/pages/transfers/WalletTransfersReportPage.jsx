import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import DownloadReportButton from "../../components/common/DownloadReportButton";
import { adminService } from "../../services/admin.service";
import { Search, Loader2, Send } from "lucide-react";

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

export default function WalletTransfersReportPage() {
  const [transfers, setTransfers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTransfers = () => {
    setLoading(true);
    adminService.getWalletTransfers({
      page,
      limit: 20,
      search: searchTerm,
    })
      .then((res) => {
        setTransfers(res.transfers || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => console.error("Error loading transfers:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransfers();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Wallet Transfer Reports"
        subtitle="Chronological audit trails of all direct member-to-member internal wallet transfers."
      >
        <DownloadReportButton
          data={transfers}
          fileName="wallet-transfers-report"
          sheetName="Internal Transfers"
          columns={[
            { header: "Date & Time", key: "createdAt" },
            { header: "Sender ID", key: "senderUserId.memberId" },
            { header: "Sender Name", key: "senderUserId.fullName" },
            { header: "Receiver ID", key: "receiverUserId.memberId" },
            { header: "Receiver Name", key: "receiverUserId.fullName" },
            { header: "Amount", key: "amount" },
            { header: "Status", key: "status" },
            { header: "Note", key: "note" },
          ]}
        />
      </AdminPageHeader>

      {/* FILTER & SEARCH PANEL */}
      <div className="flex items-center justify-end">
        <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-md">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-[#071337] pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400/80 transition"
            placeholder="Search Member ID, name, or email..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* TRANSFERS LIST TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/10 rounded-[24px] bg-[#091a4a]/75">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-3 text-xs text-slate-400">Loading transfer history...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#112766]/70">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">TRANSFER TIME</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">SENDER ACCOUNT</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300 text-center">
                    {/* Direction Arrow */}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">RECEIVER ACCOUNT</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">AMOUNT</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">STATUS</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">NOTE log</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-sm">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center text-xs text-slate-500">
                      No internal transfer operations found matching the query.
                    </td>
                  </tr>
                ) : (
                  transfers.map((item) => (
                    <tr key={item._id} className="transition hover:bg-white/5">
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{item.senderUserId?.fullName || "System/Deleted"}</div>
                        <div className="text-xs font-mono text-cyan-200">ID: {item.senderUserId?.memberId || "—"}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex rounded-full bg-cyan-400/10 p-1 text-cyan-400">
                          <Send size={12} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{item.receiverUserId?.fullName || "System/Deleted"}</div>
                        <div className="text-xs font-mono text-cyan-200">ID: {item.receiverUserId?.memberId || "—"}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400">
                        ${item.amount.toFixed(2)} USDT
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                          {item.status || "SUCCESS"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 max-w-xs truncate" title={item.note}>
                        {item.note || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 bg-[#071337]/50 px-6 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
