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
  const displayColor = color === "text-blue-300" ? "text-blue-600" :
                        color === "text-amber-300" ? "text-[#E8A13F]" :
                        color === "text-purple-300" ? "text-purple-600" :
                        "text-[#E8A13F]";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/30 transition duration-300">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{iconEmoji}</span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <h3 className={`text-2xl font-black text-slate-900 tracking-tight`}>${amount?.toFixed(2) || "0.00"}</h3>
      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-slate-600">
        {lastCredit ? (
          <>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400 font-semibold">Last Credit</span>
              <span className="text-emerald-600 font-bold">${lastCredit.amount}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400 font-semibold">From</span>
              <span className="text-slate-700 font-bold font-mono">{lastCredit.fromUser}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400 font-semibold">Date</span>
              <span className="text-slate-500 font-semibold">{formatDate(lastCredit.creditedAt).split(",")[0]}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">No credits yet</p>
        )}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-semibold">
          <span className="text-slate-400 font-semibold">Transactions</span>
          <span className="text-slate-800 font-bold">{txnCount || 0}</span>
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
    COMPANY_FUND: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    ADMIN_FUND: "bg-amber-50 text-[#F59E0B] border-amber-200 font-semibold",
    ACHIEVER_FUND: "bg-purple-50 text-purple-700 border-purple-200 font-semibold",
    LEFTOVER_TO_COMPANY: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm hover:border-emerald-300 transition duration-300">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💰</span>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Superadmin</p>
              </div>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
                ${s.totalSuperAdminFund?.toFixed(2) || "0.00"}
              </h3>
              <div className="mt-3 space-y-1.5 border-t border-emerald-200/60 pt-3">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                  <span className="font-semibold">Deposits Distributed</span>
                  <span className="font-bold">{s.totalDepositsDistributed || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                  <span className="font-semibold">User Income Total</span>
                  <span className="font-bold">${s.totalUserIncomeDistributed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-5">
        <select
          value={filters.fundType}
          onChange={(e) => setFilters((p) => ({ ...p, fundType: e.target.value }))}
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition cursor-pointer shadow-sm font-semibold"
        >
          {Object.entries(FUND_TYPE_MAP).map(([k, v]) => (
            <option key={k} value={k} className="bg-white">{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
          placeholder="From Date"
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-855 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm font-semibold"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
          placeholder="To Date"
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-855 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm font-semibold"
        />
        <button
          onClick={handleApplyFilters}
          className="rounded-xl bg-[#111827] hover:bg-[#1F2937] px-4 py-3 text-sm font-bold text-white transition shadow-md shadow-slate-100"
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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Date", "From User", "Fund Type", "Amount", "Deposit ID", "Remarks", "Status"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
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
                  <tr key={txn._id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium">{formatDate(txn.createdAt).split(",")[0]}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                      <span className="font-mono font-bold text-[#E8A13F]">{txn.fromUserId?.memberId || "—"}</span>
                      {txn.fromUserId?.fullName && (
                        <span className="ml-1 text-xs text-slate-400 font-semibold">({txn.fromUserId.fullName})</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><TypeBadge type={txn.type} /></td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">${txn.amount}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500 font-semibold">
                      {txn.depositId ? String(txn.depositId).slice(-8) : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate" title={txn.remarks}>
                      {txn.remarks || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full border border-emerald-250 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
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
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 bg-slate-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
