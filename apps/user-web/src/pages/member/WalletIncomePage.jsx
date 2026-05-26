import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  DollarSign,
  TrendingUp,
  Send,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import { walletService } from "../../services/wallet.service";
import { incomeService } from "../../services/income.service";
import { authService } from "../../services/auth.service";
import { twoFactorService } from "../../services/twoFactor.service";
import TwoFactorOtpModal from "../../components/common/TwoFactorOtpModal";

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

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function WalletIncomePage() {
  // Balance summaries and lists
  const [summary, setSummary] = useState(null);
  const [rebirths, setRebirths] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Action states
  const [activeActionTab, setActiveActionTab] = useState("withdraw"); // "withdraw" | "transfer"
  
  // Withdrawal Form state
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", address: "", network: "TRC20", note: "" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState({ success: null, message: "" });

  // Transfer Form state
  const [transferForm, setTransferForm] = useState({ memberId: "", amount: "", note: "" });
  const [receiverName, setReceiverName] = useState("");
  const [validatingReceiver, setValidatingReceiver] = useState(false);
  const [transferStatus, setTransferStatus] = useState({ success: null, message: "" });

  // Histories tab states
  const [activeHistoryTab, setActiveHistoryTab] = useState("withdrawals"); // "withdrawals" | "transfers" | "ledger"
  
  // Withdrawal History pagination & lists
  const [withdrawals, setWithdrawals] = useState([]);
  const [wPage, setWPage] = useState(1);
  const [wTotalPages, setWTotalPages] = useState(1);

  // Transfers History pagination & lists
  const [transfers, setTransfers] = useState([]);
  const [tPage, setTPage] = useState(1);
  const [tTotalPages, setTTotalPages] = useState(1);

  // Ledgers pagination & lists
  const [ledgers, setLedgers] = useState([]);
  const [lPage, setLPage] = useState(1);
  const [lTotalPages, setLTotalPages] = useState(1);

  // Fetch summaries
  const fetchWalletSummary = () => {
    walletService.getSummary()
      .then((res) => setSummary(res?.data || null))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      walletService.getSummary(),
      incomeService.getMyRebirthIds(),
      authService.getProfile(),
    ])
      .then(([wRes, rRes, pRes]) => {
        setSummary(wRes?.data || null);
        setRebirths(rRes?.data || []);
        const user = pRes?.data?.user || pRes?.data || {};
        setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch lists based on page/tab selections
  useEffect(() => {
    if (activeHistoryTab === "withdrawals") {
      walletService.getWithdrawalHistory(wPage, 10)
        .then((res) => {
          setWithdrawals(res?.data?.history || []);
          setWTotalPages(res?.data?.totalPages || 1);
        })
        .catch(() => {});
    }
  }, [activeHistoryTab, wPage]);

  useEffect(() => {
    if (activeHistoryTab === "transfers") {
      walletService.getTransferHistory(tPage, 10)
        .then((res) => {
          setTransfers(res?.data?.history || []);
          setTTotalPages(res?.data?.totalPages || 1);
        })
        .catch(() => {});
    }
  }, [activeHistoryTab, tPage]);

  useEffect(() => {
    if (activeHistoryTab === "ledger") {
      walletService.getLedger(lPage, 15)
        .then((res) => {
          setLedgers(res?.data?.logs || []);
          setLTotalPages(res?.data?.totalPages || 1);
        })
        .catch(() => {});
    }
  }, [activeHistoryTab, lPage]);

  // Live receiver validation during transfer
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const id = transferForm.memberId.trim().toUpperCase();
      if (id.length >= 4) {
        setValidatingReceiver(true);
        setReceiverName("");
        setTransferStatus({ success: null, message: "" });
        try {
          const res = await authService.validateSponsor(id);
          if (res?.data?.active) {
            setReceiverName(res.data.sponsorName);
          } else {
            setReceiverName("");
            setTransferStatus({ success: false, message: "Receiver account is not active or is blocked." });
          }
        } catch (error) {
          setReceiverName("");
          setTransferStatus({ success: false, message: error.message || "Receiver member ID not found or invalid." });
        } finally {
          setValidatingReceiver(false);
        }
      } else {
        setReceiverName("");
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [transferForm.memberId]);

  // Actions submits
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    setWithdrawStatus({ success: null, message: "" });

    const amt = Number(withdrawForm.amount);
    if (!amt || amt <= 0) {
      setWithdrawStatus({ success: false, message: "Please enter a valid withdrawal amount." });
      return;
    }
    if (!withdrawForm.address.trim()) {
      setWithdrawStatus({ success: false, message: "Please enter your USDT crypto wallet address." });
      return;
    }

    // Check remaining available balance limit (20 USDT)
    const available = summary?.availableBalance || 0;
    const charge = amt * 0.05;
    const totalDebit = amt + charge;
    if (available - totalDebit < 20) {
      setWithdrawStatus({
        success: false,
        message: `Blocked: Remaining balance after debit ($${totalDebit.toFixed(2)}) must be at least 20 USDT. Remaining would be $${(available - totalDebit).toFixed(2)}.`,
      });
      return;
    }

    if (twoFactorEnabled) {
      setShowOtpModal(true);
    } else {
      executeWithdrawal();
    }
  };

  const executeWithdrawal = async (otp = null) => {
    setActionLoading(true);
    try {
      const payload = {
        amount: Number(withdrawForm.amount),
        walletAddress: withdrawForm.address.trim(),
        network: withdrawForm.network,
        userNote: withdrawForm.note.trim(),
      };
      if (otp) payload.twoFactorCode = otp;

      await walletService.requestWithdrawal(payload);
      setWithdrawStatus({ success: true, message: "Withdrawal request submitted successfully under PENDING_ADMIN_APPROVAL." });
      setWithdrawForm({ amount: "", address: "", network: "TRC20", note: "" });
      fetchWalletSummary();
      // Reset withdrawals list
      setWPage(1);
      setShowOtpModal(false);
    } catch (err) {
      setWithdrawStatus({ success: false, message: err.message || "Failed to submit withdrawal." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpConfirm = async (otp) => {
    setActionLoading(true);
    try {
      await twoFactorService.validate(otp);
      await executeWithdrawal(otp);
    } catch (err) {
      setWithdrawStatus({ success: false, message: err.message || "2FA verification failed." });
      setActionLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferStatus({ success: null, message: "" });

    const amt = Number(transferForm.amount);
    if (!transferForm.memberId.trim()) {
      setTransferStatus({ success: false, message: "Please specify the receiver's member ID." });
      return;
    }
    if (!amt || amt <= 0) {
      setTransferStatus({ success: false, message: "Please enter a valid transfer amount." });
      return;
    }

    // Check sender balance limits (Sender available balance - amt >= 20 USDT)
    const available = summary?.availableBalance || 0;
    if (available - amt < 20) {
      setTransferStatus({
        success: false,
        message: `Blocked: Remaining balance after transfer ($${amt.toFixed(2)}) must be at least 20 USDT. Remaining would be $${(available - amt).toFixed(2)}.`,
      });
      return;
    }

    setActionLoading(true);
    try {
      await walletService.transfer({
        receiverMemberId: transferForm.memberId.trim().toUpperCase(),
        amount: amt,
        note: transferForm.note.trim(),
      });
      setTransferStatus({ success: true, message: `Wallet transfer of $${amt.toFixed(2)} completed successfully!` });
      setTransferForm({ memberId: "", amount: "", note: "" });
      fetchWalletSummary();
      // Reset transfers history
      setTPage(1);
    } catch (err) {
      setTransferStatus({ success: false, message: err.message || "Failed to complete transfer." });
    } finally {
      setActionLoading(false);
    }
  };

  const s = summary || {
    autopoolWithdrawableBalance: 0,
    sponsorIncomeBalance: 0,
    levelIncomeBalance: 0,
    walletTransferReceivedBalance: 0,
    walletTransferSentBalance: 0,
    lockedWithdrawalBalance: 0,
    totalWithdrawableBalance: 0,
    availableBalance: 0,
    lifetimeWithdrawn: 0,
    lifetimeAdminCharges: 0,
  };

  // Status Colors for history
  const getStatusBadge = (status) => {
    const colors = {
      PENDING_ADMIN_APPROVAL: "bg-amber-400/10 text-amber-300 border-amber-400/30",
      APPROVED: "bg-blue-400/10 text-blue-300 border-blue-400/30",
      PAID: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
      REJECTED: "bg-rose-400/10 text-rose-300 border-rose-400/30",
      FAILED: "bg-rose-400/10 text-rose-300 border-rose-400/30",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${colors[status] || "bg-slate-400/10 text-slate-300 border-slate-400/30"}`}>
        {status?.replace(/_/g, " ")}
      </span>
    );
  };

  const getLedgerTypeBadge = (type) => {
    const colors = {
      AUTOPOOL_WITHDRAWABLE_CREDIT: "bg-purple-400/10 text-purple-300 border-purple-400/20",
      SPONSOR_INCOME_CREDIT: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      LEVEL_INCOME_CREDIT: "bg-teal-400/10 text-teal-300 border-teal-400/20",
      ALIAS_DEDUCTION: "bg-orange-400/10 text-orange-300 border-orange-400/20",
      WITHDRAWAL_LOCK: "bg-amber-400/10 text-amber-300 border-amber-400/20",
      WITHDRAWAL_PAID: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20",
      WITHDRAWAL_REJECTED_UNLOCK: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      WALLET_TRANSFER_SENT: "bg-rose-400/10 text-rose-300 border-rose-400/20",
      WALLET_TRANSFER_RECEIVED: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors[type] || "bg-slate-400/10 text-slate-300 border-slate-400/20"}`}>
        {type?.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Wallet & Financial Control Center"
        subtitle="Manage secure USDT withdrawals, direct peer-to-peer wallet transfers, and review your audit ledger."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="mt-4 text-sm text-slate-400">Loading your balance sheet...</p>
        </div>
      ) : (
        <>
          {/* TOP SECTION: BALANCE CARDS GRID */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Primary available Balance card with glowing border */}
            <div className="relative overflow-hidden rounded-[20px] border border-cyan-400/40 bg-gradient-to-br from-[#0c2461]/90 to-[#07163e]/95 p-5 shadow-[0_0_25px_rgba(34,211,238,0.15)] transition hover:scale-[1.01]">
              <div className="absolute top-4 right-4 rounded-xl bg-cyan-400/10 p-2 text-cyan-400">
                <Wallet size={20} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Available Wallet Balance
              </p>
              <h3 className="mt-3 text-3xl font-extrabold text-white">
                {formatMoney(s.availableBalance)}
              </h3>
              <div className="mt-3 flex items-center justify-between border-t border-cyan-400/10 pt-2 text-xs text-slate-400">
                <span>Min Required Balance</span>
                <span className="font-bold text-cyan-200">20.00 USDT</span>
              </div>
            </div>

            {/* Total Withdrawable Balance card */}
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#091a4a]/85 p-5 transition hover:scale-[1.01]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Total Withdrawable
                </p>
                <span className="text-emerald-400"><TrendingUp size={16} /></span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {formatMoney(s.totalWithdrawableBalance)}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Total earnings minus sent transfers.
              </p>
            </div>

            {/* Locked Withdrawal Balance card */}
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#091a4a]/85 p-5 transition hover:scale-[1.01]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Locked Withdrawal
                </p>
                <span className="text-amber-400"><Lock size={16} /></span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-amber-300">
                {formatMoney(s.lockedWithdrawalBalance)}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Pending approval (includes 5% fee).
              </p>
            </div>

            {/* Lifetime payouts card */}
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#091a4a]/85 p-5 transition hover:scale-[1.01]">
              <div className="flex justify-between items-start">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Lifetime Payouts
                </p>
                <span className="text-blue-400"><DollarSign size={16} /></span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-cyan-300">
                {formatMoney(s.lifetimeWithdrawn)}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Paid out: {formatMoney(s.lifetimeWithdrawn)} (+ {formatMoney(s.lifetimeAdminCharges)} fee)
              </p>
            </div>
          </div>

          {/* SECONDARY ROW: BALANCE BREAKDOWNS */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5 text-center">
            <div className="rounded-xl border border-white/5 bg-[#07133a]/60 p-3">
              <p className="text-[10px] font-medium text-slate-400">Autopool Income</p>
              <h4 className="text-lg font-bold text-emerald-400 mt-1">{formatMoney(s.autopoolWithdrawableBalance)}</h4>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#07133a]/60 p-3">
              <p className="text-[10px] font-medium text-slate-400">Sponsor Income</p>
              <h4 className="text-lg font-bold text-cyan-300 mt-1">{formatMoney(s.sponsorIncomeBalance)}</h4>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#07133a]/60 p-3">
              <p className="text-[10px] font-medium text-slate-400">Level Income</p>
              <h4 className="text-lg font-bold text-teal-300 mt-1">{formatMoney(s.levelIncomeBalance)}</h4>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#07133a]/60 p-3">
              <p className="text-[10px] font-medium text-slate-400">Transferred In</p>
              <h4 className="text-lg font-bold text-sky-400 mt-1">{formatMoney(s.walletTransferReceivedBalance)}</h4>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#07133a]/60 p-3 col-span-2 md:col-span-1">
              <p className="text-[10px] font-medium text-slate-400">Transferred Out</p>
              <h4 className="text-lg font-bold text-rose-400 mt-1">{formatMoney(s.walletTransferSentBalance)}</h4>
            </div>
          </div>

          {/* MAIN BLOCK: ACTIONS FORM & REBIRTH LIST */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* User Financial Actions Card (Withdrawal & transfers) */}
            <div className="lg:col-span-8 overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-xl">
              
              {/* Card Action Tabs */}
              <div className="flex border-b border-white/10 bg-[#07153d]/90">
                <button
                  onClick={() => setActiveActionTab("withdraw")}
                  className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold tracking-wide transition ${
                    activeActionTab === "withdraw"
                      ? "bg-cyan-500/10 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ArrowDownLeft size={16} />
                  Request Withdrawal (5% Fee)
                </button>
                <button
                  onClick={() => setActiveActionTab("transfer")}
                  className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold tracking-wide transition ${
                    activeActionTab === "transfer"
                      ? "bg-cyan-500/10 text-cyan-300 border-b-2 border-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Send size={16} />
                  Transfer to Member Wallet
                </button>
              </div>

              <div className="p-6">
                {activeActionTab === "withdraw" ? (
                  /* REQUEST WITHDRAWAL FORM */
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Amount (USDT)">
                        <div className="relative">
                          <input
                            value={withdrawForm.amount}
                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] pl-10 pr-4 text-white outline-none focus:border-cyan-400/80 transition"
                            placeholder="Enter amount"
                            type="number"
                            step="0.01"
                            required
                          />
                          <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                        </div>
                      </FormField>

                      <FormField label="USDT Network">
                        <select
                          value={withdrawForm.network}
                          onChange={(e) => setWithdrawForm(prev => ({ ...prev, network: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] px-4 text-white outline-none focus:border-cyan-400/80 transition"
                        >
                          <option value="TRC20">TRON (TRC20) — Recommended</option>
                          <option value="ERC20">Ethereum (ERC20)</option>
                          <option value="BEP20">Binance Smart Chain (BEP20)</option>
                        </select>
                      </FormField>

                      <FormField label="Crypto Wallet Address" className="md:col-span-2">
                        <input
                          value={withdrawForm.address}
                          onChange={(e) => setWithdrawForm(prev => ({ ...prev, address: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] px-4 text-white outline-none focus:border-cyan-400/80 transition"
                          placeholder="Paste your USDT wallet address here"
                          type="text"
                          required
                        />
                      </FormField>

                      <FormField label="Optional Note to Admin" className="md:col-span-2">
                        <input
                          value={withdrawForm.note}
                          onChange={(e) => setWithdrawForm(prev => ({ ...prev, note: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] px-4 text-white outline-none focus:border-cyan-400/80 transition"
                          placeholder="E.g., personal emergency payout"
                          type="text"
                        />
                      </FormField>
                    </div>

                    {/* Calculated Fee Breakdown */}
                    {Number(withdrawForm.amount) > 0 && (
                      <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Withdraw Amount:</span>
                          <span className="font-semibold text-white">${Number(withdrawForm.amount).toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">5% Admin Fee:</span>
                          <span className="font-semibold text-amber-300">+ ${(Number(withdrawForm.amount) * 0.05).toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between border-t border-cyan-400/10 pt-2 text-sm">
                          <span className="font-bold text-slate-300">Total Debit amount:</span>
                          <span className="font-extrabold text-cyan-300">${(Number(withdrawForm.amount) * 1.05).toFixed(2)} USDT</span>
                        </div>
                        <div className="text-[10px] text-slate-500 italic mt-1">
                          Note: A minimum remaining balance of 20 USDT must be maintained in your account after this debit.
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 items-center rounded-xl bg-slate-500/10 p-3 text-xs text-slate-300">
                      <AlertCircle className="shrink-0 h-4 w-4 text-cyan-400" />
                      <span>
                        {twoFactorEnabled
                          ? "2FA is enabled. Submitting will trigger a Google Authenticator verification modal."
                          : "Tip: Enable 2FA in Account settings for maximum payout security."}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 flex justify-center items-center"
                      variant="primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowDownLeft className="mr-2" size={16} />}
                      Submit Payout Request
                    </Button>

                    {withdrawStatus.message && (
                      <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm border ${
                        withdrawStatus.success
                          ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                          : "bg-rose-400/10 text-rose-300 border-rose-400/20"
                      }`}>
                        {withdrawStatus.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                        <span>{withdrawStatus.message}</span>
                      </div>
                    )}
                  </form>
                ) : (
                  /* WALLET-TO-WALLET TRANSFER FORM */
                  <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Receiver Member ID">
                        <input
                          value={transferForm.memberId}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, memberId: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] px-4 text-white outline-none focus:border-cyan-400/80 transition uppercase"
                          placeholder="E.g., BKS100230"
                          type="text"
                          required
                        />
                        {validatingReceiver && (
                          <p className="text-[10px] text-cyan-400 mt-1 flex items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" /> Validating receiver...
                          </p>
                        )}
                        {receiverName && (
                          <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Receiver found: {receiverName}
                          </p>
                        )}
                      </FormField>

                      <FormField label="Transfer Amount (USDT)">
                        <div className="relative">
                          <input
                            value={transferForm.amount}
                            onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] pl-10 pr-4 text-white outline-none focus:border-cyan-400/80 transition"
                            placeholder="Enter amount"
                            type="number"
                            step="0.01"
                            required
                          />
                          <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                        </div>
                      </FormField>

                      <FormField label="Transfer Note (Optional)" className="md:col-span-2">
                        <input
                          value={transferForm.note}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, note: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#050f2f] px-4 text-white outline-none focus:border-cyan-400/80 transition"
                          placeholder="Enter transfer purpose..."
                          type="text"
                        />
                      </FormField>
                    </div>

                    <div className="flex gap-2 items-center rounded-xl bg-slate-500/10 p-3 text-xs text-slate-300">
                      <AlertCircle className="shrink-0 h-4 w-4 text-cyan-400" />
                      <span>
                        Wallet-to-wallet transfers are instant, free of admin charge (0%), and require no admin approval. Remaining available balance must be &gt;= 20 USDT.
                      </span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 flex justify-center items-center"
                      variant="primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="mr-2" size={16} />}
                      Transfer Balance Instantly
                    </Button>

                    {transferStatus.message && (
                      <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm border ${
                        transferStatus.success
                          ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                          : "bg-rose-400/10 text-rose-300 border-rose-400/20"
                      }`}>
                        {transferStatus.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                        <span>{transferStatus.message}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* PRESERVED SECTION: REBIRTH IDS LIST CARD */}
            <div className="lg:col-span-4 flex flex-col">
              <Card title="My Rebirth IDs" className="flex-1">
                {rebirths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border border-white/5 rounded-xl bg-[#030b25]/50">
                    <HelpCircle className="h-8 w-8 text-slate-600" />
                    <p className="text-xs text-slate-500 mt-2 text-center">No Rebirth accounts generated yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                    {rebirths.map((rb) => (
                      <div
                        key={rb._id}
                        className="rounded-xl border border-cyan-300/10 bg-[linear-gradient(170deg,rgba(15,33,88,0.7),rgba(10,24,67,0.8))] p-3.5 transition hover:border-cyan-400/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {rb.rebirthCode}
                          </span>
                          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            Slot {rb.sequenceNo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Wallet Balance</span>
                          <span className="text-lg font-bold text-emerald-400">
                            ${rb.walletBalance?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-2 text-slate-500">
                          <span>Created</span>
                          <span>{new Date(rb.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* BOTTOM SECTION: DETAILED HISTORIES & IMMUTABLE LEDGER */}
          <Card className="p-0 overflow-hidden">
            
            {/* History Tabs Header */}
            <div className="flex border-b border-white/10 bg-[#071337] overflow-x-auto">
              <button
                onClick={() => setActiveHistoryTab("withdrawals")}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                  activeHistoryTab === "withdrawals"
                    ? "border-b-2 border-cyan-400 bg-white/5 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ArrowDownLeft size={14} />
                Withdrawals History
              </button>
              <button
                onClick={() => setActiveHistoryTab("transfers")}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                  activeHistoryTab === "transfers"
                    ? "border-b-2 border-cyan-400 bg-white/5 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ArrowUpRight size={14} />
                Wallet Transfer History
              </button>
              <button
                onClick={() => setActiveHistoryTab("ledger")}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                  activeHistoryTab === "ledger"
                    ? "border-b-2 border-cyan-400 bg-white/5 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <History size={14} />
                Immutable Wallet Ledger
              </button>
            </div>

            <div className="p-5">
              {activeHistoryTab === "withdrawals" && (
                /* WITHDRAWAL HISTORY TAB */
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 pb-2">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Date Requested</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Payout Amt</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Charges (5%)</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Network & Wallet Address</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Tx Hash / Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {withdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                              No withdrawals recorded yet.
                            </td>
                          </tr>
                        ) : (
                          withdrawals.map((w) => (
                            <tr key={w._id} className="hover:bg-white/5 transition">
                              <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(w.requestedAt)}</td>
                              <td className="px-4 py-3 font-bold text-white">${w.requestedAmount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-300">${w.adminChargeAmount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <div className="text-xs font-mono text-cyan-200">{w.network}</div>
                                <div className="text-xs text-slate-400 max-w-[200px] truncate" title={w.walletAddress}>{w.walletAddress}</div>
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(w.status)}</td>
                              <td className="px-4 py-3 text-xs text-slate-400">
                                {w.txHash ? (
                                  <div className="font-mono text-emerald-400 truncate max-w-[120px]" title={w.txHash}>{w.txHash}</div>
                                ) : w.rejectionReason ? (
                                  <div className="text-rose-400 italic">{w.rejectionReason}</div>
                                ) : (
                                  <span className="text-slate-600">Pending dispatch</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {wTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => setWPage((p) => Math.max(1, p - 1))}
                        disabled={wPage <= 1}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs text-slate-400">Page {wPage} of {wTotalPages}</span>
                      <button
                        onClick={() => setWPage((p) => Math.min(wTotalPages, p + 1))}
                        disabled={wPage >= wTotalPages}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeHistoryTab === "transfers" && (
                /* WALLET-TO-WALLET TRANSFER HISTORY TAB */
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 pb-2">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Time</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Counterparty</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Transfer Amount</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {transfers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              No peer-to-peer transfers recorded yet.
                            </td>
                          </tr>
                        ) : (
                          transfers.map((t) => {
                            const isSender = t.senderUserId?._id === summary?.userId || t.senderUserId === summary?.userId;
                            return (
                              <tr key={t._id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                                <td className="px-4 py-3">
                                  {isSender ? (
                                    <span className="inline-flex rounded bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300">SENT</span>
                                  ) : (
                                    <span className="inline-flex rounded bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">RECEIVED</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {isSender ? (
                                    <div>
                                      <span className="font-semibold text-white">{t.receiverUserId?.fullName || "Member"}</span>
                                      <span className="ml-1.5 font-mono text-xs text-cyan-200">({t.receiverUserId?.memberId || "..."})</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-semibold text-white">{t.senderUserId?.fullName || "Member"}</span>
                                      <span className="ml-1.5 font-mono text-xs text-cyan-200">({t.senderUserId?.memberId || "..."})</span>
                                    </div>
                                  )}
                                </td>
                                <td className={`px-4 py-3 font-bold ${isSender ? "text-rose-300" : "text-emerald-400"}`}>
                                  {isSender ? "-" : "+"}${t.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-xs">{t.note || "—"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {tTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => setTPage((p) => Math.max(1, p - 1))}
                        disabled={tPage <= 1}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs text-slate-400">Page {tPage} of {tTotalPages}</span>
                      <button
                        onClick={() => setTPage((p) => Math.min(tTotalPages, p + 1))}
                        disabled={tPage >= tTotalPages}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeHistoryTab === "ledger" && (
                /* IMMUTABLE AUDIT LEDGER TAB */
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 pb-2">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Timestamp</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Entry Event</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Dir</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Bal Before</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Bal After</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Audit Trail details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs font-mono">
                        {ledgers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm font-sans text-slate-500">
                              No ledger operations recorded yet.
                            </td>
                          </tr>
                        ) : (
                          ledgers.map((log) => {
                            const isCredit = log.direction === "CREDIT" || log.direction === "UNLOCK";
                            return (
                              <tr key={log._id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                                <td className="px-4 py-3">{getLedgerTypeBadge(log.type)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    log.direction === "CREDIT" ? "bg-emerald-500/10 text-emerald-400" :
                                    log.direction === "DEBIT" ? "bg-rose-500/10 text-rose-400" :
                                    log.direction === "LOCK" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                                  }`}>
                                    {log.direction}
                                  </span>
                                </td>
                                <td className={`px-4 py-3 font-bold text-sm ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                                  {isCredit ? "+" : "-"}${log.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-slate-400">${log.balanceBefore.toFixed(2)}</td>
                                <td className="px-4 py-3 text-cyan-200">${log.balanceAfter.toFixed(2)}</td>
                                <td className="px-4 py-3 text-slate-300 font-sans max-w-xs truncate" title={log.description}>{log.description}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {lTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => setLPage((p) => Math.max(1, p - 1))}
                        disabled={lPage <= 1}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs text-slate-400 font-sans">Page {lPage} of {lTotalPages}</span>
                      <button
                        onClick={() => setLPage((p) => Math.min(lTotalPages, p + 1))}
                        disabled={lPage >= lTotalPages}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* 2FA Verification Dialog */}
      <TwoFactorOtpModal
        open={showOtpModal}
        title="Authorize Payout"
        description="Please provide your Google Authenticator OTP to complete this payout."
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setShowOtpModal(false);
        }}
        onSubmit={handleOtpConfirm}
      />
    </div>
  );
}
