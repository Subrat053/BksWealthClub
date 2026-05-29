import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import SectionTitle from "../../components/common/SectionTitle";
import { apiClient } from "../../services/apiClient";
import { ACTIVATION_AMOUNT_USD } from "../../utils/constants";

// ─── Dynamic active credential fetching ────────────────────────────────────────
const FALLBACK_CREDENTIAL = {
  network: "USDT BEP20",
  walletAddress: "0x2783ca72018AF778c0C89bcd78db33B5CF40DC88",
  instructions: "Pay me via Trust Wallet: https://link.trustwallet.com/send?coin=20000714&address=0x2783ca72018AF778c0C89bcd78db33B5CF40DC88&token_id=0x55d398326f99059fF775485246999027B3197955",
  qrCodeUrl: ""
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  });
}

function StatusPill({ status }) {
  const map = {
    pending: {
      label: "Pending",
      cls: "bg-[#FFF4E5] text-[#E8A13F] border-[#F4B860]/40 font-bold",
    },
    approved: {
      label: "Approved",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DepositPage() {
  const [step, setStep] = useState("form"); // "form" | "qr" | "confirm"
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletType, setWalletType] = useState("USDT");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const [activeCredential, setActiveCredential] = useState(null);
  const [activeLoading, setActiveLoading] = useState(true);

  // fetch active credential and deposit history on mount
  useEffect(() => {
    fetchActiveCredential();
    fetchHistory();
  }, []);

  const fetchActiveCredential = async () => {
    setActiveLoading(true);
    try {
      const res = await apiClient("/deposit-credentials/active");
      setActiveCredential(res?.data || FALLBACK_CREDENTIAL);
    } catch {
      setActiveCredential(FALLBACK_CREDENTIAL);
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/deposits/my");
      setHistory(res?.data || []);
    } catch {
      // silently fail; history just stays empty
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    setError("");
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (val < ACTIVATION_AMOUNT_USD) {
      setError(`Minimum activation amount is $${ACTIVATION_AMOUNT_USD}.`);
      return;
    }
    if (!activeCredential) {
      setError("Deposit credentials are not currently configured by the administrator. Please try again later or contact support.");
      return;
    }
    setStep("qr");
  };

  const handleCopyAddress = () => {
    if (activeCredential?.walletAddress) {
      navigator.clipboard.writeText(activeCredential.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitProof = async () => {
    setError("");
    if (!txHash.trim()) {
      setError("Please enter your transaction hash.");
      return;
    }
    setSubmitLoading(true);
    try {
      await apiClient("/deposits", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletType,
          txHash: txHash.trim(),
        }),
      });
      setSuccess("Deposit submitted! Awaiting admin approval.");
      setStep("form");
      setAmount("");
      setTxHash("");
      fetchHistory();
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep("form");
    setError("");
    setTxHash("");
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Deposit"
        subtitle="Send USDT to our wallet and submit your transaction hash for verification"
      />

      {/* ── Step 1: Amount form ── */}
      {step === "form" && (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-800">
              Enter Amount
            </h2>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
                {success}
              </div>
            )}

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                $
              </span>
              <input
                type="number"
                min={ACTIVATION_AMOUNT_USD}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePayNow()}
                placeholder={`${ACTIVATION_AMOUNT_USD}`}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition"
              />
            </div>

            <p className="mb-5 text-xs text-slate-400">
              Minimum activation:{" "}
              <span className="text-[#E8A13F] font-bold">${ACTIVATION_AMOUNT_USD}</span>
            </p>

            <button
              onClick={handlePayNow}
              disabled={activeLoading}
              className="h-12 w-full rounded-xl bg-[#111827] hover:bg-[#1F2937] font-bold text-white shadow-xs active:scale-[0.98] transition disabled:opacity-50"
            >
              {activeLoading ? "Loading details..." : "Pay Now"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: QR + wallet address + txHash ── */}
      {step === "qr" && activeCredential && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Close
            </button>
            <div className="flex flex-col md:flex-row justify-evenly md:p-1 items-center md:gap-8">
              <div className="w-full md:w-auto">
                {/* Header */}
                <div className="mb-6 md:pr-0 text-center">
                  <h2 className="text-xl font-bold text-slate-855">
                    BKS Wealth Club
                  </h2>
                  <p className="mt-1 text-sm text-slate-555">
                    Scan QR or copy the address below
                  </p>
                </div>

                {/* QR Code (Premium custom design border and box) */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    {activeCredential.qrCodeUrl ? (
                      <img
                        src={activeCredential.qrCodeUrl}
                        alt="QR Code"
                        className="h-[180px] w-[180px] object-contain"
                      />
                    ) : (
                      <QRCodeSVG
                        value={activeCredential.instructions.includes("https://") ? activeCredential.instructions.split("https://")[1] ? "https://" + activeCredential.instructions.split("https://")[1] : activeCredential.walletAddress : activeCredential.walletAddress}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0a0f1e"
                        level="M"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#F4B860]/30 bg-[#FFF4E5] px-4 py-2">
                    <span className="rounded bg-[#E8A13F] px-2 py-0.5 text-xs font-bold text-white uppercase">
                      {activeCredential.network.split(' ')[0]}
                    </span>
                    <span className="text-base font-bold text-[#E8A13F]">
                      {Number(amount).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full md:max-w-sm">
                {/* Wallet address box (Matching the exact custom theme requested) */}
                <div className="mb-5 rounded-xl border border-[#F4B860]/40 bg-[#FFF4E5] p-3 text-[#111827]">
                  <p className="mb-1 text-xs text-slate-500 font-bold">
                    Address ({activeCredential.network})
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 break-all font-mono text-xs font-bold">
                      {activeCredential.walletAddress}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="shrink-0 rounded-lg bg-[#111827] text-white hover:bg-[#1F2937] px-2.5 py-1.5 text-xs font-bold transition"
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                {activeCredential.instructions ? (
                  <div className="mb-5 rounded-xl border border-[#F4B860]/20 bg-[#FFF4E5] px-4 py-3 text-xs text-[#111827] leading-relaxed break-all">
                    <p className="font-bold text-slate-700 mb-1">Instructions:</p>
                    <p className="whitespace-pre-line font-medium break-all">{activeCredential.instructions}</p>
                  </div>
                ) : (
                  <div className="mb-5 space-y-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800/90 leading-relaxed">
                    <p>
                      1. Send exactly{" "}
                      <strong className="text-blue-955 font-bold">
                        {Number(amount).toFixed(2)} USDT
                      </strong>{" "}
                      to the address above.
                    </p>
                    <p>2. Copy the transaction hash from your wallet app.</p>
                    <p>
                      3. Paste it below and click{" "}
                      <strong className="text-blue-955 font-bold">Confirm Payment</strong>.
                    </p>
                  </div>
                )}

                {/* txHash input */}
                {error && (
                  <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste transaction hash (0x...)"
                  className="mb-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitProof}
                disabled={submitLoading}
                className="h-12 flex-1 rounded-xl bg-[#111827] font-bold text-white shadow-xs transition hover:bg-[#1F2937] active:scale-[0.98] disabled:opacity-60"
              >
                {submitLoading ? "Submitting..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History table ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">History</h3>
        </div>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  "S.No.",
                  "Amount",
                  "Wallet Type",
                  "Tx Hash",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500"
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
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No deposits yet.
                  </td>
                </tr>
              ) : (
                history.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">
                      ${item.amount}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {item.walletType || "USDT"}
                    </td>
                    <td
                      className="px-5 py-4 font-mono text-xs text-[#E8A13F] font-bold"
                      title={item.txHash}
                    >
                      {shortHash(item.txHash)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No deposits yet.</div>
          ) : (
            history.map((item, idx) => (
              <div key={item._id || idx} className="p-4 space-y-3 transition active:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <StatusPill status={item.status} />
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-lg font-bold text-slate-855">${item.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm text-slate-600">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Transaction Hash</span>
                    <span className="text-[10px] font-bold text-[#E8A13F]">{item.walletType || "USDT"}</span>
                  </div>
                  <p className="font-mono text-xs text-slate-600 break-all">{item.txHash}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
