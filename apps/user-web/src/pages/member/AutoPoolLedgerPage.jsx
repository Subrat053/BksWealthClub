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
    case "REBIRTH_AUTOPOOL_COMPLETED": return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "LEVEL_AUTOPOOL_COMPLETED": return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    case "USER_WITHDRAWAL_CREDIT": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "REINVEST_TO_POOL_FUND": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "NEW_REBIRTH_ALLOCATION": return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    case "SPONSOR_DEDUCTION": return "bg-rose-500/15 text-rose-300 border-rose-500/30";
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
      const data = await autopoolService.getMyPoolFundLedger();
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
          Detailed history of additions and deductions related to your AutoPool progress.
        </p>
      </div>

      <Card className="border-amber-500/20! bg-[#081730]/95!">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-amber-500/10">
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest text-center">AutoPool</th>
                <th className="px-6 py-4 text-[10px] font-bold text-amber-300 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/10">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-amber-200/40">Loading ledger data...</td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-amber-200/40 italic">No AutoPool transactions found.</td>
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
                        <span className="text-xs font-bold text-amber-200">{item.completedRebirthId?.nodeCode || "-"}</span>
                        <span className="text-[10px] text-amber-200/40 font-bold uppercase tracking-tighter">Level {item.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${item.type.includes('CREDIT') || item.type.includes('COMPLETED') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.type.includes('DEDUCTION') || item.type.includes('REINVEST') ? '-' : ''}{formatCurrency(item.amount)}
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
