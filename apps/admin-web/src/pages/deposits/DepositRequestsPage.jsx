import { useState, useEffect, useRef } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { depositService } from "../../services/deposit.service";
import DownloadReportButton from "../../components/common/DownloadReportButton";

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
    pending: "bg-[#FFF4E5] text-[#E8A13F] border-[#F4B860]/40 font-bold",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    rejected: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-slate-800">
          Reject Deposit
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Rejecting deposit from{" "}
          <span className="text-slate-800 font-medium">
            {deposit?.userRef?.memberId || "user"}
          </span>{" "}
          — ${deposit?.amount}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={3}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-855 placeholder-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-slate-800">
          Approve Deposit
        </h3>
        <p className="mb-3 text-sm text-slate-500">
          Approve deposit from{" "}
          <span className="text-slate-800 font-medium">
            {deposit?.userRef?.memberId || deposit?.userRef?.fullName || "user"}
          </span>{" "}
          —{" "}
          <span className="text-emerald-600 font-bold">${deposit?.amount}</span>
        </p>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          ⚠️ This will trigger income distribution: rebirth IDs, sponsor income,
          level income, and fund allocations.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#111827] py-2.5 text-sm font-semibold text-white hover:bg-[#1F2937] transition disabled:opacity-60"
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
      color: "text-cyan-600",
    },
    {
      label: "RB2 Wallet Credit",
      value: dist?.rebirths?.rb2?.walletCredit ?? 20,
      color: "text-cyan-600",
    },
    {
      label: "Sponsor Income",
      value: dist?.sponsorIncome?.amount ?? 5,
      color: "text-emerald-600",
    },
    {
      label: "Company Fund",
      value: dist?.superAdminFunds?.companyFund ?? 5,
      color: "text-blue-600",
    },
    {
      label: "Achiever Fund",
      value: dist?.superAdminFunds?.achieverFund ?? 4,
      color: "text-purple-600",
    },
    {
      label: "Admin Fund",
      value: dist?.superAdminFunds?.adminFund ?? 5,
      color: "text-amber-600",
    },
    {
      label: "Level Income (9 levels)",
      value: 16 - (dist?.levelIncome?.leftover ?? 0),
      color: "text-teal-600",
    },
  ];

  if (dist?.levelIncome?.leftover > 0) {
    rows.push({
      label: "Level Leftover → Company",
      value: dist.levelIncome.leftover,
      color: "text-orange-600",
    });
  }

  if (dist?.remainder > 0) {
    rows.push({
      label: "Remainder → Company",
      value: dist.remainder,
      color: "text-slate-600",
    });
  }

  const total = dist?.totalDistributed ?? 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">
            ✅ Distribution Summary
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        {dist?.memberId && (
          <p className="mb-3 text-sm text-slate-500">
            Member:{" "}
            <span className="font-mono text-cyan-600 font-bold">{dist.memberId}</span>
          </p>
        )}

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
            >
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className={`text-sm font-bold ${r.color}`}>${r.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-800">
            Total Distributed
          </span>
          <span className="text-lg font-bold text-emerald-700">${total}</span>
        </div>

        {dist?.transactionCount && (
          <p className="mt-2 text-center text-xs text-slate-400">
            {dist.transactionCount} audit log entries created
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-[#111827] py-3 text-sm font-semibold text-white transition hover:bg-[#1F2937]"
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
  const [searchQuery, setSearchQuery] = useState("");
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
      const errMsg = err?.response?.data?.message || err.message || "Approval failed.";
      showToast(errMsg, "error");
      alert(errMsg);
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
      const errMsg = err?.response?.data?.message || err.message || "Rejection failed.";
      showToast(errMsg, "error");
      alert(errMsg);
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const filtered = deposits.filter((d) => {
    // 1. Status Filter
    let statusMatch = true;
    if (filter === "pending") {
      statusMatch = d.status === "pending" || d._id === recentlyApprovedDepositId;
    } else if (filter !== "all") {
      statusMatch = d.status === filter;
    }

    if (!statusMatch) return false;

    // 2. Search Query Filter
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const memberId = d.userRef?.memberId || "";
    const fullName = d.userRef?.fullName || "";
    const txHash = d.txHash || "";
    const email = d.userRef?.email || "";
    return (
      memberId.toLowerCase().includes(s) ||
      fullName.toLowerCase().includes(s) ||
      txHash.toLowerCase().includes(s) ||
      email.toLowerCase().includes(s)
    );
  });

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
              ? "border-rose-200 bg-rose-50 text-rose-700 font-medium"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium"
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

      {/* Search, Filter tabs & Export */}
      <div className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-2 items-center">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition ${
                filter === tab
                  ? "border-[#F4B860]/40 bg-[#FFF4E5] text-[#E8A13F]"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab}{" "}
              <span className="ml-1 text-xs opacity-60">({counts[tab]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, member ID..."
            className="w-full sm:max-w-[240px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition"
          />
          <DownloadReportButton
            data={filtered}
            fileName="deposits-report"
            sheetName="Deposits"
            columns={[
              { header: "Member ID", key: "userRef.memberId" },
              { header: "Name", key: "userRef.fullName" },
              { header: "Amount", key: "amount" },
              { header: "Wallet", key: "walletType" },
              { header: "Tx Hash", key: "txHash" },
              { header: "Status", key: "status", format: "capitalize" },
              { header: "Date", key: "createdAt", format: "date" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
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
                    className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    Loading deposits...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-400"
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
                      className={`transition hover:bg-[#FFF4E5]/20 ${
                        justApproved ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-mono font-bold text-slate-700">
                        {item.userRef?.memberId || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {item.userRef?.fullName || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">
                        ${item.amount}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                        {item.walletType || "USDT"}
                      </td>
                      <td
                        className="px-5 py-4 font-mono text-xs text-[#E8A13F] font-bold cursor-pointer hover:text-[#E8A13F]/80 transition"
                        title={item.txHash}
                        onClick={() =>
                          navigator.clipboard.writeText(item.txHash || "")
                        }
                      >
                        {shortHash(item.txHash)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 font-medium">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {justApproved ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 shadow-inner">
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
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                              {actionLoading === item._id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectTarget(item)}
                              disabled={actionLoading === item._id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">
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
