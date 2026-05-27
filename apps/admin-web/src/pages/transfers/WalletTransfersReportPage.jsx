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

    adminService
      .getWalletTransfers({
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
    <div className="space-y-6">
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

      {/* Search */}
      <div className="flex items-center justify-end">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex w-full max-w-md"
        >
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-11
              w-full
              rounded-xl
              border
              border-[#E5E7EB]
              bg-white
              pl-10
              pr-4
              text-sm
              text-[#111827]
              placeholder:text-[#9CA3AF]
              outline-none
              transition-all
              duration-300
              focus:border-[#F4B860]
              focus:ring-4
              focus:ring-[#F4B860]/20
            "
            placeholder="Search Member ID, name, or email..."
          />

          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#9CA3AF]" />

          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-20 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#F4B860]" />

          <p className="mt-3 text-sm text-[#6B7280]">
            Loading transfer history...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Transfer Time
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Sender Account
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Flow
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Receiver Account
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3F4F6] text-sm">
                {transfers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-16 text-center text-sm text-[#9CA3AF]"
                    >
                      No internal transfer operations found matching the query.
                    </td>
                  </tr>
                ) : (
                  transfers.map((item) => (
                    <tr
                      key={item._id}
                      className="transition-all duration-200 hover:bg-[#FFF4E5]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#6B7280]">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">
                          {item.senderUserId?.fullName || "System/Deleted"}
                        </div>

                        <div className="mt-1 text-xs font-mono text-[#6B7280]">
                          ID: {item.senderUserId?.memberId || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex rounded-full bg-[#FFF4E5] p-2 text-[#E8A13F]">
                          <Send size={14} />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">
                          {item.receiverUserId?.fullName ||
                            "System/Deleted"}
                        </div>

                        <div className="mt-1 text-xs font-mono text-[#6B7280]">
                          ID: {item.receiverUserId?.memberId || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-[#10B981]">
                        ${item.amount.toFixed(2)} USDT
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-[#10B981]">
                          {item.status || "SUCCESS"}
                        </span>
                      </td>

                      <td
                        className="max-w-xs truncate px-5 py-4 text-sm text-[#6B7280]"
                        title={item.note}
                      >
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
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="
                  rounded-xl
                  border
                  border-[#E5E7EB]
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[#374151]
                  transition-all
                  duration-300
                  hover:bg-[#FFF4E5]
                  disabled:opacity-40
                "
              >
                ← Previous
              </button>

              <span className="text-sm text-[#6B7280]">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page >= totalPages}
                className="
                  rounded-xl
                  border
                  border-[#E5E7EB]
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[#374151]
                  transition-all
                  duration-300
                  hover:bg-[#FFF4E5]
                  disabled:opacity-40
                "
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