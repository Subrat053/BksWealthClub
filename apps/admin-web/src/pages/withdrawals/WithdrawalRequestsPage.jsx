import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";
import DownloadReportButton from "../../components/common/DownloadReportButton";
import { adminService } from "../../services/admin.service";
import { Search, Loader2, ArrowRight, ShieldCheck, XCircle, Ban, CreditCard } from "lucide-react";

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

export default function WithdrawalRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING_ADMIN_APPROVAL"); // Default pending
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchWithdrawals = () => {
    setLoading(true);
    adminService.getWithdrawals({
      page,
      limit: 20,
      status: statusFilter,
      search: searchTerm,
    })
      .then((res) => {
        setRequests(res.requests || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => console.error("Error loading withdrawals:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, statusFilter]);

  // Handle manual trigger search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWithdrawals();
  };

  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to approve this withdrawal? The amount will remain locked.")) return;
    setActionLoading(true);
    try {
      await adminService.approveWithdrawal(id);
      fetchWithdrawals();
    } catch (err) {
      alert(err.message || "Failed to approve withdrawal.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await adminService.rejectWithdrawal(selectedRequest._id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
      fetchWithdrawals();
    } catch (err) {
      setActionError(err.message || "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaidSubmit = async (e) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setActionError("Transaction Hash is required.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await adminService.markPaidWithdrawal(selectedRequest._id, {
        txHash: txHash.trim(),
        adminNote: adminNote.trim(),
      });
      setShowPaidModal(false);
      setTxHash("");
      setAdminNote("");
      setSelectedRequest(null);
      fetchWithdrawals();
    } catch (err) {
      setActionError(err.message || "Failed to mark as PAID.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Withdrawal Requests"
        subtitle="Review, approve, reject, or mark withdrawal payouts as paid."
      >
        <DownloadReportButton
          data={requests}
          fileName="withdrawals-report"
          sheetName="Withdrawals"
          columns={[
            { header: "Requested At", key: "requestedAt" },
            { header: "Member ID", key: "userId.memberId" },
            { header: "FullName", key: "userId.fullName" },
            { header: "Requested Amount", key: "requestedAmount" },
            { header: "Admin Charge", key: "adminChargeAmount" },
            { header: "Total Debit", key: "totalDebit" },
            { header: "Wallet Address", key: "walletAddress" },
            { header: "Network", key: "network" },
            { header: "Status", key: "status" },
          ]}
        />
      </AdminPageHeader>

      {/* FILTER & SEARCH PANEL */}
      <div className="grid gap-4 md:flex md:items-center md:justify-between">
        
        {/* Status Filter Tabs */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 overflow-x-auto shrink-0">
          {[
            { label: "Pending Approval", value: "PENDING_ADMIN_APPROVAL" },
            { label: "Approved Payouts", value: "APPROVED" },
            { label: "Paid Out", value: "PAID" },
            { label: "Rejected Requests", value: "REJECTED" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setPage(1);
                setStatusFilter(tab.value);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === tab.value
                  ? "bg-white text-slate-800 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-855"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex flex-1 max-w-md">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition"
            placeholder="Search Member ID, Name, or Wallet Address..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* REQUESTS LIST TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-slate-200 rounded-[24px] bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#E8A13F]" />
          <p className="mt-3 text-xs text-slate-500">Loading payout records...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">REQUEST TIME</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">USER</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">REQ AMOUNT</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ADMIN FEE (5%)</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">TOTAL DEBIT</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">WALLET ADDRESS</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">STATUS</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center text-xs text-slate-400">
                      No withdrawal requests in this filter category.
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr key={item._id} className="transition hover:bg-[#FFF4E5]/20">
                      <td className="px-5 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(item.requestedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{item.userId?.fullName || "Deleted User"}</div>
                        <div className="text-xs font-mono font-bold text-[#E8A13F]">ID: {item.userId?.memberId || "—"}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        ${item.requestedAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        ${item.adminChargeAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-slate-900">
                        ${item.totalDebit.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-mono font-semibold text-slate-655">{item.network}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]" title={item.walletAddress}>
                          {item.walletAddress}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status === "PENDING_ADMIN_APPROVAL" ? "pending" : item.status === "PAID" ? "success" : item.status === "REJECTED" ? "failed" : "pending"} />
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {item.status === "PENDING_ADMIN_APPROVAL" && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(item._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <ShieldCheck size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowRejectModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Ban size={13} />
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status === "APPROVED" && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowPaidModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
                            >
                              <CreditCard size={13} />
                              Mark Paid
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowRejectModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Ban size={13} />
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status === "PAID" && (
                          <div className="text-xs text-slate-400 font-mono font-medium" title={item.txHash}>
                            Tx: {item.txHash?.substring(0, 10)}...
                          </div>
                        )}
                        {item.status === "REJECTED" && (
                          <div className="text-xs text-rose-600 font-bold italic max-w-[120px] truncate" title={item.rejectionReason}>
                            {item.rejectionReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 shadow-xs"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 shadow-xs"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: REJECT REQUEST */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <XCircle className="text-rose-500" size={18} />
              Reject Withdrawal Request
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Please enter the rejection reason. This will release the locked balance ($
              {selectedRequest?.totalDebit.toFixed(2)}) back to the user's available balance instantly.
            </p>
            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition min-h-[80px]"
                  placeholder="E.g., Invalid wallet address provided, or KYC verification failed."
                  required
                />
              </div>
              {actionError && <p className="text-xs text-rose-600 font-semibold">{actionError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-655 hover:bg-slate-100"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban size={14} />}
                  Reject and Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS PAID */}
      {showPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="text-[#E8A13F]" size={18} />
              Confirm Manual Payout (PAID)
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Ensure you have sent the USDT amount (payable: <b className="text-slate-800">${selectedRequest?.requestedAmount.toFixed(2)}</b>) on
              the network <b className="text-slate-800">{selectedRequest?.network}</b> to: <br />
              <span className="font-mono text-[#E8A13F] font-bold select-all bg-slate-50 px-2 py-1 rounded border border-slate-100 block mt-1 break-all">{selectedRequest?.walletAddress}</span>
            </p>
            <form onSubmit={handlePaidSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Transaction Hash (TxID)</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition"
                  placeholder="Paste blockchain transaction hash"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Admin Dispatch Notes (Optional)</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition"
                  placeholder="E.g., Dispatched from Binance vault"
                />
              </div>
              {actionError && <p className="text-xs text-rose-600 font-semibold">{actionError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaidModal(false);
                    setTxHash("");
                    setAdminNote("");
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-655 hover:bg-slate-100"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-4 py-2 text-xs font-bold text-white hover:bg-[#1F2937] disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck size={14} />}
                  Mark as Dispatched
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
