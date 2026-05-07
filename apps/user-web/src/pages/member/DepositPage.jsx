import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import SectionTitle from "../../components/common/SectionTitle";
import Card from "../../components/common/Card";
import { apiClient } from "../../services/apiClient";
import { ACTIVATION_AMOUNT_USD } from "../../utils/constants";

// ─── Company wallet config (update when backend settings API is ready) ────────
const COMPANY_WALLET = {
  address: "0xca79683c3cF78A5bb991d1C8b19005F5D9ADBDf1",
  network: "BEP20 (BSC)",
  currency: "USDT",
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
      cls: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    },
    approved: {
      label: "Approved",
      cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-400/15 text-red-300 border-red-400/30",
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

  // fetch deposit history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

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
    setStep("qr");
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(COMPANY_WALLET.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // ── QR data ──────────────────────────────────────────────────────────────
  const qrValue = COMPANY_WALLET.address;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Deposit"
        subtitle="Send USDT to our wallet and submit your transaction hash for verification"
      />

      {/* ── Step 1: Amount form ── */}
      {step === "form" && (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#0d1f4a]/80 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="mb-5 text-lg font-semibold text-white">
              Enter Amount
            </h2>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                $
              </span>
              <input
                type="number"
                min={ACTIVATION_AMOUNT_USD}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePayNow()}
                placeholder={`${ACTIVATION_AMOUNT_USD}`}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1a2d5a] pl-8 pr-4 text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 transition"
              />
            </div>

            <p className="mb-5 text-xs text-slate-500">
              Minimum activation:{" "}
              <span className="text-cyan-400">${ACTIVATION_AMOUNT_USD}</span>
            </p>

            <button
              onClick={handlePayNow}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98]"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: QR + wallet address + txHash ── */}
      {step === "qr" && (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#0d1f4a]/80 p-6 shadow-xl backdrop-blur-sm">
            {/* Back button */}
            <button
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            {/* Header */}
            <div className="mb-5 text-center">
              <h2 className="text-lg font-semibold text-white">
                BKS Wealth Club
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Scan QR or copy the address below
              </p>
            </div>

            {/* QR Code */}
            <div className="mb-5 flex flex-col items-center">
              <div className="rounded-2xl border border-white/10 bg-white p-4 shadow-lg">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0a0f1e"
                  level="M"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5">
                <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-black">
                  BSC
                </span>
                <span className="text-sm font-semibold text-amber-200">
                  {parseFloat(amount).toFixed(2)} USDT
                </span>
              </div>
            </div>

            {/* Wallet address */}
            <div className="mb-5 rounded-xl border border-white/10 bg-[#1a2d5a] p-3">
              <p className="mb-1 text-xs text-slate-500">
                Address ({COMPANY_WALLET.network})
              </p>
              <div className="flex items-center gap-2">
                <p className="flex-1 break-all font-mono text-xs text-slate-300">
                  {COMPANY_WALLET.address}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-5 rounded-xl border border-blue-400/20 bg-blue-400/5 px-4 py-3 text-xs text-blue-200/80 space-y-1">
              <p>
                1. Send exactly{" "}
                <strong className="text-white">
                  ${parseFloat(amount).toFixed(2)} USDT
                </strong>{" "}
                to the address above.
              </p>
              <p>2. Copy the transaction hash from your wallet app.</p>
              <p>
                3. Paste it below and click{" "}
                <strong className="text-white">Confirm Payment</strong>.
              </p>
            </div>

            {/* txHash input */}
            {error && (
              <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste transaction hash (0x...)"
              className="mb-4 h-12 w-full rounded-xl border border-white/10 bg-[#1a2d5a] px-4 font-mono text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 transition"
            />

            <button
              onClick={handleSubmitProof}
              disabled={submitLoading}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] disabled:opacity-60"
            >
              {submitLoading ? "Submitting..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}

      {/* ── History table ── */}
      <div className="rounded-2xl border border-white/10 bg-[#091a4a]/75 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
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
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400"
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
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No deposits yet.
                  </td>
                </tr>
              ) : (
                history.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="transition hover:bg-white/5"
                  >
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-white">
                      ${item.amount}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {item.walletType || "USDT"}
                    </td>
                    <td
                      className="px-5 py-4 font-mono text-xs text-slate-400"
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
      </div>
    </div>
  );
}
