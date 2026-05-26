import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import { walletService } from "../../services/wallet.service";
import { authService } from "../../services/auth.service";

export default function WithdrawalHistoryPage() {
  const [activeTab, setActiveTab] = useState("withdrawals"); // "withdrawals" | "transfers"
  
  // Data lists & loading states
  const [withdrawals, setWithdrawals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Pagination states
  const [wPage, setWPage] = useState(1);
  const [wTotalPages, setWTotalPages] = useState(1);
  const [tPage, setTPage] = useState(1);
  const [tTotalPages, setTTotalPages] = useState(1);

  // Copy helper
  const [copiedId, setCopiedId] = useState(null);
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const fetchProfileAndData = async () => {
    setLoading(true);
    try {
      const pRes = await authService.getProfile();
      const user = pRes?.data?.user || pRes?.data || {};
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await walletService.getWithdrawalHistory(wPage, 10);
      setWithdrawals(res?.data?.history || []);
      setWTotalPages(res?.data?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching withdrawal history:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await walletService.getTransferHistory(tPage, 10);
      setTransfers(res?.data?.history || []);
      setTTotalPages(res?.data?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching transfer history:", err);
    } finally {
      setLoading(false);
    }
  };

  // On mount, fetch user profile
  useEffect(() => {
    fetchProfileAndData();
  }, []);

  // Fetch lists based on active tab and page changes
  useEffect(() => {
    if (activeTab === "withdrawals") {
      fetchWithdrawals();
    } else {
      fetchTransfers();
    }
  }, [activeTab, wPage, tPage]);

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Custom column definitions
  const withdrawalColumns = [
    { key: "serial", label: "S No." },
    { key: "amount", label: "Requested ($)" },
    { key: "charges", label: "Admin Charges" },
    { key: "payable", label: "Net Payable" },
    { key: "network", label: "Network" },
    { key: "address", label: "Wallet Address" },
    { key: "status", label: "Status" },
    { key: "details", label: "Memo / TxHash" },
    { key: "date", label: "Date" }
  ];

  const transferColumns = [
    { key: "serial", label: "S No." },
    { key: "type", label: "Type" },
    { key: "partner", label: "Partner ID & Name" },
    { key: "amount", label: "Amount ($)" },
    { key: "note", label: "Note / Description" },
    { key: "date", label: "Date" }
  ];

  // Map database withdrawals into rich JSX row elements
  const mappedWithdrawals = withdrawals.map((w, idx) => {
    const sNo = (wPage - 1) * 10 + idx + 1;
    
    // Status Badge generator
    let statusBadge = null;
    switch (w.status) {
      case "PENDING_ADMIN_APPROVAL":
        statusBadge = (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Pending Approval
          </span>
        );
        break;
      case "APPROVED":
        statusBadge = (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
            Approved
          </span>
        );
        break;
      case "PAID":
        statusBadge = (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Paid
          </span>
        );
        break;
      case "REJECTED":
        statusBadge = (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Rejected
          </span>
        );
        break;
      default:
        statusBadge = (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            {w.status}
          </span>
        );
    }

    // Details cell containing TxHash, notes or rejection reason
    let detailsCell = <span className="text-slate-400 font-italic text-xs">No extra info</span>;
    if (w.status === "REJECTED" && w.rejectionReason) {
      detailsCell = (
        <div className="text-rose-300 text-xs">
          <span className="font-bold">Reason:</span> {w.rejectionReason}
        </div>
      );
    } else if (w.status === "PAID" && w.txHash) {
      detailsCell = (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 truncate max-w-[120px]">{w.txHash}</span>
          <button
            onClick={() => handleCopy(w.txHash, w._id)}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-cyan-400 transition active:scale-90"
            title="Copy Tx Hash"
          >
            {copiedId === w._id ? (
              <span className="text-[10px] text-emerald-400">Copied</span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )}
          </button>
        </div>
      );
    } else if (w.userNote) {
      detailsCell = <span className="text-slate-300 text-xs">{w.userNote}</span>;
    }

    return {
      serial: <span className="font-semibold text-slate-400">{sNo}</span>,
      amount: <span className="font-bold text-white">${w.requestedAmount?.toFixed(2)}</span>,
      charges: <span className="text-slate-300">${w.adminChargeAmount?.toFixed(2)} (5%)</span>,
      payable: <span className="font-bold text-emerald-400">${(w.requestedAmount - w.adminChargeAmount)?.toFixed(2)}</span>,
      network: <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1d2d54] text-cyan-300 border border-cyan-500/10 font-sans">{w.network || "TRC20"}</span>,
      address: <span className="font-mono text-xs text-slate-300 truncate max-w-[140px]" title={w.walletAddress}>{w.walletAddress}</span>,
      status: statusBadge,
      details: detailsCell,
      date: <span className="text-xs text-slate-300">{formatDate(w.createdAt)}</span>
    };
  });

  // Map database transfers into rich JSX row elements
  const mappedTransfers = transfers.map((t, idx) => {
    const sNo = (tPage - 1) * 10 + idx + 1;
    
    // Determine direction relative to current user
    const currentUserIdStr = currentUser?._id ? String(currentUser._id) : "";
    const senderIdStr = t.senderUserId?._id ? String(t.senderUserId._id) : String(t.senderUserId);
    
    const isSent = senderIdStr === currentUserIdStr;
    const typeBadge = isSent ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
        <svg className="w-3 h-3 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        Sent
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
        <svg className="w-3 h-3 rotate-225" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        Received
      </span>
    );

    // Get partner info
    const partner = isSent ? t.receiverUserId : t.senderUserId;
    const partnerId = partner?.memberId || "-";
    const partnerName = partner?.fullName || "BKS Member";

    return {
      serial: <span className="font-semibold text-slate-400">{sNo}</span>,
      type: typeBadge,
      partner: (
        <div>
          <span className="font-bold text-white block uppercase tracking-wide text-xs">{partnerId}</span>
          <span className="text-[11px] text-slate-400">{partnerName}</span>
        </div>
      ),
      amount: <span className={`font-bold ${isSent ? 'text-rose-400' : 'text-emerald-400'}`}>
        {isSent ? "-" : "+"}${t.amount?.toFixed(2)}
      </span>,
      note: <span className="text-xs text-slate-300">{t.note || "Peer-to-Peer Transfer"}</span>,
      date: <span className="text-xs text-slate-300">{formatDate(t.createdAt)}</span>
    };
  });

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Transaction History"
        subtitle="Review audit trails of your withdrawal payouts and direct member transfers"
      />

      <div className="rounded-2xl border border-white/10 bg-[#151c2c] overflow-hidden shadow-2xl">
        {/* Navigation Tabs switcher */}
        <div className="flex border-b border-white/10 bg-[#111724]">
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex-1 py-4 text-center font-bold transition-all duration-300 ${
              activeTab === "withdrawals"
                ? "bg-[#151c2c] text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            USDT Withdrawal Requests
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex-1 py-4 text-center font-bold transition-all duration-300 ${
              activeTab === "transfers"
                ? "bg-[#151c2c] text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            P2P Wallet Transfers
          </button>
        </div>

        {/* Content table block */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <svg className="animate-spin h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-400 text-sm animate-pulse">Loading transaction logs...</p>
            </div>
          ) : activeTab === "withdrawals" ? (
            /* WITHDRAWALS HISTORICAL DATA TABLE */
            <div className="space-y-4">
              <DataTable
                columns={withdrawalColumns}
                rows={mappedWithdrawals}
                emptyText="No withdrawal requests submitted yet."
              />
              
              {wTotalPages > 1 && (
                <div className="flex justify-between items-center bg-[#111724]/60 p-4 rounded-xl border border-white/5 mt-4">
                  <button
                    onClick={() => setWPage((p) => Math.max(p - 1, 1))}
                    disabled={wPage === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition duration-150"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-400">
                    Page <strong className="text-cyan-400">{wPage}</strong> of {wTotalPages}
                  </span>
                  <button
                    onClick={() => setWPage((p) => Math.min(p + 1, wTotalPages))}
                    disabled={wPage === wTotalPages}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition duration-150"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TRANSFERS HISTORICAL DATA TABLE */
            <div className="space-y-4">
              <DataTable
                columns={transferColumns}
                rows={mappedTransfers}
                emptyText="No peer-to-peer wallet transfers recorded yet."
              />
              
              {tTotalPages > 1 && (
                <div className="flex justify-between items-center bg-[#111724]/60 p-4 rounded-xl border border-white/5 mt-4">
                  <button
                    onClick={() => setTPage((p) => Math.max(p - 1, 1))}
                    disabled={tPage === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition duration-150"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-400">
                    Page <strong className="text-cyan-400">{tPage}</strong> of {tTotalPages}
                  </span>
                  <button
                    onClick={() => setTPage((p) => Math.min(p + 1, tTotalPages))}
                    disabled={tPage === tTotalPages}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition duration-150"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
