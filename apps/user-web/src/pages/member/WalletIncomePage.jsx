import { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import { incomeService } from "../../services/income.service";

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

const TYPE_LABELS = {
  RB_INCOME: "Rebirth Wallet",
  SPONSOR_INCOME: "Sponsor Income",
  LEVEL_INCOME: "Level Income",
  COMPANY_FUND: "Company Fund",
  ADMIN_FUND: "Admin Fund",
  ACHIEVER_FUND: "Achiever Fund",
  LEFTOVER_TO_COMPANY: "Leftover",
  AUTOPOOL_INCOME: "AutoPool Income",
};

function TypeBadge({ type }) {
  const colors = {
    RB_INCOME: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
    SPONSOR_INCOME: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    LEVEL_INCOME: "bg-teal-400/15 text-teal-300 border-teal-400/30",
    AUTOPOOL_INCOME: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[type] || "bg-slate-400/15 text-slate-300 border-slate-400/30"}`}
    >
      {TYPE_LABELS[type] || type?.replace(/_/g, " ")}
    </span>
  );
}

export default function WalletIncomePage() {
  const [wallet, setWallet] = useState(null);
  const [rebirths, setRebirths] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    Promise.all([
      incomeService.getMyWallet(),
      incomeService.getMyRebirthIds(),
    ]).then(([wRes, rRes]) => {
      setWallet(wRes?.data || null);
      setRebirths(rRes?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    incomeService.getMyIncomeLogs({ page, limit: 20 })
      .then((res) => {
        const data = res?.data || {};
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setLogs([]));
  }, [page]);

  const w = wallet || {};
  const walletCards = [
    {
      label: "AUTOPOOL WITHDRAWABLE",
      value: formatMoney(w.autopoolWithdrawableFund),
      accent: "text-emerald-300",
    },
    {
      label: "POOL FUND",
      value: formatMoney(w.poolFundTotal),
      accent: "text-cyan-300",
    },
    {
      label: "REINVESTMENT FUND",
      value: formatMoney(w.reinvestmentFundTotal),
      accent: "text-teal-300",
    },
    {
      label: "DIRECT REFERRAL",
      value: formatMoney(w.directReferralIncome),
      accent: "text-amber-300",
    },
    {
      label: "LEVEL INCOME",
      value: formatMoney(w.levelIncome),
      accent: "text-purple-300",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Wallet & Income"
        subtitle="View your wallet balances, rebirth IDs, and income history"
      />

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Loading wallet data...</p>
      ) : (
        <>
          {/* Wallet Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {walletCards.map((card) => (
              <Card
                key={card.label}
                className="bg-[linear-gradient(170deg,rgba(15,33,88,0.92),rgba(10,24,67,0.95))]"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  {card.label}
                </p>
                <h3 className={`mt-2 text-3xl font-bold ${card.accent}`}>
                  {card.value}
                </h3>
              </Card>
            ))}
          </div>

          {/* Rebirth IDs */}
          {rebirths.length > 0 && (
            <Card title="My Rebirth IDs">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rebirths.map((rb) => (
                  <div
                    key={rb._id}
                    className="rounded-xl border border-cyan-300/15 bg-[linear-gradient(170deg,rgba(15,33,88,0.7),rgba(10,24,67,0.8))] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-bold text-cyan-300">
                        {rb.rebirthCode}
                      </span>
                      <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">
                        RB{rb.sequenceNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Wallet Balance</span>
                      <span className="text-xl font-bold text-emerald-300">
                        ${rb.walletBalance?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
                      <span>Created</span>
                      <span>{formatDate(rb.createdAt)}</span>
                    </div>
                    {rb.sourceDepositId && (
                      <div className="flex items-center justify-between text-xs mt-1 text-slate-500">
                        <span>Deposit</span>
                        <span>${rb.sourceDepositId.amount} — {rb.sourceDepositId.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Income History */}
          <Card title="Income History">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    {["Date", "Type", "Level", "Amount", "Remarks"].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                        No income history yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5 transition">
                        <td className="px-3 py-3 text-xs text-slate-400">{formatDate(log.createdAt)}</td>
                        <td className="px-3 py-3"><TypeBadge type={log.type} /></td>
                        <td className="px-3 py-3 text-sm text-slate-300">
                          {log.level ? `Level ${log.level}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-emerald-300">${log.amount}</td>
                        <td className="px-3 py-3 text-xs text-slate-400 max-w-50 truncate">{log.remarks || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
