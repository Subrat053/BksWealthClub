import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { adminIncomeService } from "../../services/adminIncome.service";
import DownloadReportButton from "../../components/common/DownloadReportButton";

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

function FundCard({ title, amount, lastCredit, txnCount, color, iconEmoji }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{iconEmoji}</span>
        <p className="text-sm font-medium text-blue-100/70">{title}</p>
      </div>
      <h3 className={`text-3xl font-bold ${color}`}>${amount?.toFixed(2) || "0.00"}</h3>
      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
        {lastCredit ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Last Credit</span>
              <span className="text-emerald-300 font-medium">${lastCredit.amount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">From</span>
              <span className="text-slate-200 font-mono">{lastCredit.fromUser}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Date</span>
              <span className="text-slate-300">{formatDate(lastCredit.creditedAt)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 italic">No credits yet</p>
        )}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
          <span className="text-slate-400">Transactions</span>
          <span className="text-slate-200 font-semibold">{txnCount || 0}</span>
        </div>
      </div>
    </div>
  );
}

const FUND_TYPE_MAP = {
  "": "All Fund Types",
  COMPANY_FUND: "Company Fund",
  ADMIN_FUND: "Admin Fund",
  ACHIEVER_FUND: "Achiever Fund",
  LEFTOVER_TO_COMPANY: "Leftover → Company",
};

function TypeBadge({ type }) {
  const colors = {
    COMPANY_FUND: "bg-blue-400/15 text-blue-300 border-blue-400/30",
    ADMIN_FUND: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    ACHIEVER_FUND: "bg-purple-400/15 text-purple-300 border-purple-400/30",
    LEFTOVER_TO_COMPANY: "bg-orange-400/15 text-orange-300 border-orange-400/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[type] || "bg-slate-400/15 text-slate-300 border-slate-400/30"}`}
    >
      {FUND_TYPE_MAP[type] || type}
    </span>
  );
}

export default function FundsPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);
  const [filters, setFilters] = useState({ fundType: "", dateFrom: "", dateTo: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await adminIncomeService.getFundsSummary();
      setSummary(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch funds summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTxnLoading(true);
    try {
      const res = await adminIncomeService.getFundTransactions({
        page,
        limit: 30,
        ...filters,
      });
      const data = res?.data || {};
      setTransactions(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch fund transactions:", err);
      setTransactions([]);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchTransactions();
  };

  const s = summary || {};
  const lc = s.lastCredits || {};
  const tc = s.transactionCounts || {};

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Company Funds"
        subtitle="Monitor superadmin fund balances and incoming fund transactions."
      />

      {/* Fund Summary Cards */}
      {loading ? (
        <div className="text-sm text-slate-500 text-center py-8">Loading fund summary...</div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <FundCard
              title="Company Fund"
              amount={s.companyFund}
              lastCredit={lc.COMPANY_FUND}
              txnCount={tc.companyFund}
              color="text-blue-300"
              iconEmoji="🏢"
            />
            <FundCard
              title="Admin Fund"
              amount={s.adminFund}
              lastCredit={lc.ADMIN_FUND}
              txnCount={tc.adminFund}
              color="text-amber-300"
              iconEmoji="🔑"
            />
            <FundCard
              title="Achiever Fund"
              amount={s.achieverFund}
              lastCredit={lc.ACHIEVER_FUND}
              txnCount={tc.achieverFund}
              color="text-purple-300"
              iconEmoji="🏆"
            />
            <FundCard
              title="Leftover Fund"
              amount={s.leftoverFund}
              lastCredit={lc.LEFTOVER_TO_COMPANY}
              txnCount={tc.leftoverFund}
              color="text-orange-300"
              iconEmoji="📦"
            />
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💰</span>
                <p className="text-sm font-medium text-emerald-200">Total Superadmin</p>
              </div>
              <h3 className="text-3xl font-bold text-emerald-300">
                ${s.totalSuperAdminFund?.toFixed(2) || "0.00"}
              </h3>
              <div className="mt-3 space-y-1.5 border-t border-emerald-400/10 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200/60">Deposits Distributed</span>
                  <span className="text-emerald-200 font-semibold">{s.totalDepositsDistributed || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200/60">User Income Total</span>
                  <span className="text-emerald-200 font-semibold">${s.totalUserIncomeDistributed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:grid-cols-5">
        <select
          value={filters.fundType}
          onChange={(e) => setFilters((p) => ({ ...p, fundType: e.target.value }))}
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        >
          {Object.entries(FUND_TYPE_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
          placeholder="From Date"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
          placeholder="To Date"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        />
        <button
          onClick={handleApplyFilters}
          className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]"
        >
          Apply Filters
        </button>
        <div className="flex items-center justify-end">
          <DownloadReportButton
            data={transactions}
            fileName={filters.fundType ? `${filters.fundType.toLowerCase()}-report` : "fund-transactions-report"}
            sheetName="Transactions"
            columns={[
              { header: "Date", key: "createdAt", format: "date" },
              { header: "From Member ID", key: "fromUserId.memberId" },
              { header: "From Name", key: "fromUserId.fullName" },
              { header: "Fund Type", key: "type" },
              { header: "Amount", key: "amount" },
              { header: "Deposit ID", key: "depositId" },
              { header: "Remarks", key: "remarks" },
              { header: "Status", key: "status" },
            ]}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                {["Date", "From User", "Fund Type", "Amount", "Deposit ID", "Remarks", "Status"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {txnLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No fund transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(txn.createdAt)}</td>
                    <td className="px-5 py-4 text-sm text-slate-200">
                      <span className="font-mono text-cyan-300">{txn.fromUserId?.memberId || "—"}</span>
                      {txn.fromUserId?.fullName && (
                        <span className="ml-1 text-xs text-slate-400">({txn.fromUserId.fullName})</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><TypeBadge type={txn.type} /></td>
                    <td className="px-5 py-4 text-sm font-semibold text-emerald-300">${txn.amount}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {txn.depositId ? String(txn.depositId).slice(-8) : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={txn.remarks}>
                      {txn.remarks || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
