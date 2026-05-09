import { useState, useEffect, useRef } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { depositService } from "../../services/deposit.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shortHash(hash) {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

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

function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    approved: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    rejected: "bg-red-400/15 text-red-300 border-red-400/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || map.pending}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ deposit, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1f4a] p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-white">
          Reject Deposit
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Rejecting deposit from{" "}
          <span className="text-white">
            {deposit?.userRef?.memberId || "user"}
          </span>{" "}
          — ${deposit?.amount}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={3}
          className="mb-4 w-full rounded-xl border border-white/10 bg-[#1a2d5a] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-red-400/40 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approve Confirmation Modal ───────────────────────────────────────────────
function ApproveConfirmModal({ deposit, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1f4a] p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-white">
          Approve Deposit
        </h3>
        <p className="mb-3 text-sm text-slate-400">
          Approve deposit from{" "}
          <span className="text-white font-medium">
            {deposit?.userRef?.memberId || deposit?.userRef?.fullName || "user"}
          </span>{" "}
          —{" "}
          <span className="text-emerald-300 font-bold">${deposit?.amount}</span>
        </p>
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          ⚠️ This will trigger income distribution: rebirth IDs, sponsor income,
          level income, and fund allocations.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-emerald-500/80 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-60"
          >
            {loading ? "Approving..." : "Confirm Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Distribution Summary Modal ───────────────────────────────────────────────
function DistributionSummaryModal({ summary, onClose }) {
  if (!summary) return null;

  const dist = summary.incomeDistribution || summary;
  const rows = [
    {
      label: "RB1 Wallet Credit",
      value: dist?.rebirths?.rb1?.walletCredit ?? 20,
      color: "text-cyan-300",
    },
    {
      label: "RB2 Wallet Credit",
      value: dist?.rebirths?.rb2?.walletCredit ?? 20,
      color: "text-cyan-300",
    },
    {
      label: "Sponsor Income",
      value: dist?.sponsorIncome?.amount ?? 5,
      color: "text-emerald-300",
    },
    {
      label: "Company Fund",
      value: dist?.superAdminFunds?.companyFund ?? 5,
      color: "text-blue-300",
    },
    {
      label: "Achiever Fund",
      value: dist?.superAdminFunds?.achieverFund ?? 4,
      color: "text-purple-300",
    },
    {
      label: "Admin Fund",
      value: dist?.superAdminFunds?.adminFund ?? 5,
      color: "text-amber-300",
    },
    {
      label: "Level Income (9 levels)",
      value: 16 - (dist?.levelIncome?.leftover ?? 0),
      color: "text-teal-300",
    },
  ];

  if (dist?.levelIncome?.leftover > 0) {
    rows.push({
      label: "Level Leftover → Company",
      value: dist.levelIncome.leftover,
      color: "text-orange-300",
    });
  }

  if (dist?.remainder > 0) {
    rows.push({
      label: "Remainder → Company",
      value: dist.remainder,
      color: "text-slate-300",
    });
  }

  const total = dist?.totalDistributed ?? 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1f4a] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            ✅ Distribution Summary
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {dist?.memberId && (
          <p className="mb-3 text-sm text-slate-400">
            Member:{" "}
            <span className="font-mono text-cyan-300">{dist.memberId}</span>
          </p>
        )}

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-2.5"
            >
              <span className="text-sm text-slate-300">{r.label}</span>
              <span className={`text-sm font-bold ${r.color}`}>${r.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-200">
            Total Distributed
          </span>
          <span className="text-lg font-bold text-emerald-300">${total}</span>
        </div>

        {dist?.transactionCount && (
          <p className="mt-2 text-center text-xs text-slate-500">
            {dist.transactionCount} audit log entries created
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-[#1e327d] py-3 text-sm font-semibold text-white transition hover:bg-[#2944a8]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DepositRequestsPage() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [distributionSummary, setDistributionSummary] = useState(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [recentlyApprovedDepositId, setRecentlyApprovedDepositId] =
    useState(null);
  const approvalHighlightTimerRef = useRef(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    return () => {
      if (approvalHighlightTimerRef.current) {
        clearTimeout(approvalHighlightTimerRef.current);
      }
    };
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await depositService.getAllDeposits();
      setDeposits(res?.data || []);
    } catch (err) {
      showToast(err.message || "Failed to fetch deposits", "error");
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (deposit) => {
    setApproveTarget(deposit);
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    const depositId = approveTarget._id;
    setActionLoading(depositId);
    try {
      const res = await depositService.approveDeposit(depositId);
      setDeposits((prev) =>
        prev.map((d) =>
          d._id === depositId ? { ...d, status: "approved" } : d,
        ),
      );
      setRecentlyApprovedDepositId(depositId);
      if (approvalHighlightTimerRef.current) {
        clearTimeout(approvalHighlightTimerRef.current);
      }
      approvalHighlightTimerRef.current = setTimeout(() => {
        setRecentlyApprovedDepositId(null);
      }, 3500);
      showToast("Deposit approved and income distributed successfully.");
      // Show distribution summary if available
      const distData = res?.data?.incomeDistribution || res?.data;
      if (distData) {
        setDistributionSummary(distData);
      }
    } catch (err) {
      showToast(err.message || "Approval failed.", "error");
    } finally {
      setActionLoading(null);
      setApproveTarget(null);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    const depositId = rejectTarget._id;
    setActionLoading(depositId);
    try {
      await depositService.rejectDeposit(depositId, reason);
      setDeposits((prev) =>
        prev.map((d) =>
          d._id === depositId ? { ...d, status: "rejected" } : d,
        ),
      );
      showToast("Deposit rejected.");
    } catch (err) {
      showToast(err.message || "Rejection failed.", "error");
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const filtered =
    filter === "all"
      ? deposits
      : filter === "pending"
        ? deposits.filter(
            (d) =>
              d.status === "pending" || d._id === recentlyApprovedDepositId,
          )
        : deposits.filter((d) => d.status === filter);

  const counts = {
    all: deposits.length,
    pending: deposits.filter((d) => d.status === "pending").length,
    approved: deposits.filter((d) => d.status === "approved").length,
    rejected: deposits.filter((d) => d.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl transition-all ${
            toast.type === "error"
              ? "border-red-400/30 bg-red-400/10 text-red-300"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {rejectTarget && (
        <RejectModal
          deposit={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading === rejectTarget._id}
        />
      )}

      {approveTarget && (
        <ApproveConfirmModal
          deposit={approveTarget}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproveTarget(null)}
          loading={actionLoading === approveTarget._id}
        />
      )}

      {distributionSummary && (
        <DistributionSummaryModal
          summary={distributionSummary}
          onClose={() => setDistributionSummary(null)}
        />
      )}

      <AdminPageHeader
        title="Deposits"
        subtitle="Review submitted deposits and trigger member activation on approval."
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
              filter === tab
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {tab}{" "}
            <span className="ml-1 text-xs opacity-60">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#091a4a]/75 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                {[
                  "Member ID",
                  "Name",
                  "Amount",
                  "Wallet",
                  "Tx Hash",
                  "Date",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading deposits...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No deposits found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const justApproved = item._id === recentlyApprovedDepositId;

                  return (
                    <tr
                      key={item._id}
                      className={`transition hover:bg-white/5 ${
                        justApproved ? "bg-emerald-500/10" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-mono text-cyan-300">
                        {item.userRef?.memberId || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-200">
                        {item.userRef?.fullName || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-white">
                        ${item.amount}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {item.walletType || "USDT"}
                      </td>
                      <td
                        className="px-5 py-4 font-mono text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition"
                        title={item.txHash}
                        onClick={() =>
                          navigator.clipboard.writeText(item.txHash || "")
                        }
                      >
                        {shortHash(item.txHash)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {justApproved ? (
                          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-inner shadow-emerald-500/10">
                            Approved successfully
                          </div>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {item.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveClick(item)}
                              disabled={actionLoading === item._id}
                              className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                            >
                              {actionLoading === item._id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectTarget(item)}
                              disabled={actionLoading === item._id}
                              className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-400/20 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            {item.status === "approved"
                              ? "Activated ✓"
                              : "Rejected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
