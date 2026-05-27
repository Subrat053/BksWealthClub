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
    case "POOL_FUND_CREDIT": return "bg-blue-50 text-blue-600 border-blue-200";
    case "REINVESTMENT_FUND_CREDIT": return "bg-amber-50 text-[#F59E0B] border-amber-200";
    case "WITHDRAWABLE_AUTOPOOL_CREDIT": return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "UPGRADE_ID_DEDUCTION": return "bg-rose-50 text-rose-600 border-rose-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
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
        <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#F4B860] to-[#E8A13F]" />
        <h1 className="text-3xl font-bold leading-none text-[#111827] md:text-4xl">Auto Pool Ledger</h1>
        <p className="max-w-2xl text-sm text-[#6B7280] md:text-base">
          Detailed history of additions and deductions in your isolated AutoPool wallets.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Source Rebirth</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Balance After</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest pl-8">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#9CA3AF]">Loading ledger data...</td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#9CA3AF] italic">No AutoPool transactions found.</td>
                </tr>
              ) : (
                ledger.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FFF4E5] transition-colors duration-200">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-[#111827]">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(item.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${getTypeBadgeColor(item.type)}`}>
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#F4B860] font-mono">{item.sourceRebirthId || "-"}</span>
                        <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-tighter">Level {item.completedLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${item.type === 'UPGRADE_ID_DEDUCTION' ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {item.type === 'UPGRADE_ID_DEDUCTION' ? '-' : '+'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[#111827]">
                        {formatCurrency(item.balanceAfter)}
                      </span>
                    </td>
                    <td className="px-6 py-4 pl-8">
                      <span className="text-xs text-[#6B7280] font-medium">
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
