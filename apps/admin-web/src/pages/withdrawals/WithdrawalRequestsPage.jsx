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
        <div className="flex rounded-xl border border-white/10 bg-[#071337] p-1 overflow-x-auto shrink-0">
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
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === tab.value
                  ? "bg-[#162457] text-white"
                  : "text-slate-400 hover:text-white"
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
            className="h-10 w-full rounded-xl border border-white/10 bg-[#071337] pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400/80 transition"
            placeholder="Search Member ID, Name, or Wallet Address..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* REQUESTS LIST TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/10 rounded-[24px] bg-[#091a4a]/75">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-3 text-xs text-slate-400">Loading payout records...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#112766]/70">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">REQUEST TIME</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">USER</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">REQ AMOUNT</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">ADMIN FEE (5%)</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">TOTAL DEBIT</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">WALLET ADDRESS</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300">STATUS</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-300 text-center">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-sm">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center text-xs text-slate-500">
                      No withdrawal requests in this filter category.
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr key={item._id} className="transition hover:bg-white/5">
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(item.requestedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{item.userId?.fullName || "Deleted User"}</div>
                        <div className="text-xs font-mono text-cyan-200">ID: {item.userId?.memberId || "—"}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                        ${item.requestedAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        ${item.adminChargeAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-bold text-cyan-300">
                        ${item.totalDebit.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-mono text-cyan-200">{item.network}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]" title={item.walletAddress}>
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
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                            >
                              <ShieldCheck size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowRejectModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
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
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
                            >
                              <CreditCard size={13} />
                              Mark Paid
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowRejectModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                            >
                              <Ban size={13} />
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status === "PAID" && (
                          <div className="text-xs text-slate-400 font-mono" title={item.txHash}>
                            Tx: {item.txHash?.substring(0, 10)}...
                          </div>
                        )}
                        {item.status === "REJECTED" && (
                          <div className="text-xs text-rose-400 italic max-w-[120px] truncate" title={item.rejectionReason}>
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

      {/* MODAL: REJECT REQUEST */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#07102e] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="text-rose-400" size={18} />
              Reject Withdrawal Request
            </h3>
            <p className="mt-2 text-xs text-slate-400">
              Please enter the rejection reason. This will release the locked balance ($
              {selectedRequest?.totalDebit.toFixed(2)}) back to the user's available balance instantly.
            </p>
            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#050f2f] p-3 text-xs text-white outline-none focus:border-cyan-400 transition min-h-[80px]"
                  placeholder="E.g., Invalid wallet address provided, or KYC verification failed."
                  required
                />
              </div>
              {actionError && <p className="text-xs text-rose-400 font-semibold">{actionError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#07102e] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="text-cyan-400" size={18} />
              Confirm Manual Payout (PAID)
            </h3>
            <p className="mt-2 text-xs text-slate-400">
              Ensure you have sent the USDT amount (payable: ${selectedRequest?.requestedAmount.toFixed(2)}) on
              the network <b>{selectedRequest?.network}</b> to: <br />
              <span className="font-mono text-cyan-300 select-all">{selectedRequest?.walletAddress}</span>
            </p>
            <form onSubmit={handlePaidSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Transaction Hash (TxID)</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#050f2f] px-3 text-xs text-white outline-none focus:border-cyan-400 transition"
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
                  className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#050f2f] px-3 text-xs text-white outline-none focus:border-cyan-400 transition"
                  placeholder="E.g., Dispatched from Binance vault"
                />
              </div>
              {actionError && <p className="text-xs text-rose-400 font-semibold">{actionError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaidModal(false);
                    setTxHash("");
                    setAdminNote("");
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
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
