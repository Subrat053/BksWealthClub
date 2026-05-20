import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import Card from "../../components/common/Card";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getTypeBadgeColor = (type) => {
  switch (type) {
    case "POOL_FUND_CREDIT": return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "REINVESTMENT_FUND_CREDIT": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "WITHDRAWABLE_AUTOPOOL_CREDIT": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "UPGRADE_ID_DEDUCTION": return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    default: return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
};

export default function AutoPoolLedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await autopoolService.getMyFundTransactions();
      setLedger(data);
    } catch (err) {
      console.error("Failed to fetch ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-1 w-24 rounded-full bg-linear-to-r from-amber-300 via-amber-500 to-yellow-200" />
        <h1 className="text-3xl font-bold leading-none text-white md:text-4xl">Auto Pool Ledger</h1>
        <p className="max-w-2xl text-sm text-amber-100/70 md:text-base">
          Detailed history of additions and deductions in your isolated AutoPool wallets.
        </p>
      </div>

      <Card className="border-amber-500/20! bg-[#081730]/95!">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-amber-500/10">
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest text-center">Source Rebirth</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest text-right">Balance After</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest pl-8">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-amber-200/40">Loading ledger data...</td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-amber-200/40 italic">No AutoPool transactions found.</td>
                </tr>
              ) : (
                ledger.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-amber-200/50 mt-0.5">{new Date(item.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${getTypeBadgeColor(item.type)}`}>
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-200 font-mono">{item.sourceRebirthId || "-"}</span>
                        <span className="text-[10px] text-amber-200/40 font-bold uppercase tracking-tighter">Level {item.completedLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${item.type === 'UPGRADE_ID_DEDUCTION' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.type === 'UPGRADE_ID_DEDUCTION' ? '-' : '+'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-300">
                        {formatCurrency(item.balanceAfter)}
                      </span>
                    </td>
                    <td className="px-6 py-4 pl-8">
                      <span className="text-xs text-amber-100/70 font-medium">
                        {item.description}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
