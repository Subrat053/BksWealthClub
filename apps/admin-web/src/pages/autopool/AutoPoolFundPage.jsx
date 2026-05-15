import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const AutoPoolFundPage = () => {
  const [summary, setSummary] = useState(null);
  const [ledgerData, setLedgerData] = useState({ ledger: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    userId: "",
    level: "",
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, ledgerRes] = await Promise.all([
        autopoolService.getPoolFundSummary(),
        autopoolService.getPoolFundLedger(filters),
      ]);
      setSummary(summaryRes);
      setLedgerData(ledgerRes);
    } catch (err) {
      console.error("Failed to fetch pool fund data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "REBIRTH_AUTOPOOL_COMPLETED": return "bg-blue-100 text-blue-700";
      case "LEVEL_AUTOPOOL_COMPLETED": return "bg-purple-100 text-purple-700";
      case "USER_WITHDRAWAL_CREDIT": return "bg-green-100 text-green-700";
      case "REINVEST_TO_POOL_FUND": return "bg-amber-100 text-amber-700";
      case "SPONSOR_DEDUCTION": return "bg-indigo-100 text-indigo-700";
      case "COMPANY_FUND_DEDUCTION": return "bg-rose-100 text-rose-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Auto Pool Fund Management" 
        subtitle="Ledger tracking for rebirth completions and level distributions" 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Reinvest", value: summary?.totalReinvest, color: "text-amber-600" },
          { label: "Withdrawals Sent", value: summary?.totalWithdrawal, color: "text-green-600" },
          { label: "Sponsor Income", value: summary?.totalSponsor, color: "text-indigo-600" },
          { label: "Company Fund", value: summary?.totalCompany, color: "text-rose-600" },
          { label: "Completed Rebirths", value: summary?.completedRebirths, color: "text-blue-600", noCurrency: true },
          { label: "Completed Levels", value: summary?.completedLevels, color: "text-purple-600", noCurrency: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-xl font-black mt-1 ${stat.color}`}>
              {stat.noCurrency ? stat.value : formatCurrency(stat.value || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type</label>
          <select 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange}
            className="block w-full bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="REBIRTH_AUTOPOOL_COMPLETED">Rebirth Completed</option>
            <option value="LEVEL_AUTOPOOL_COMPLETED">Level Completed</option>
            <option value="USER_WITHDRAWAL_CREDIT">Withdrawal Credit</option>
            <option value="REINVEST_TO_POOL_FUND">Reinvest Fund</option>
            <option value="SPONSOR_DEDUCTION">Sponsor Deduction</option>
            <option value="COMPANY_FUND_DEDUCTION">Company Deduction</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">User ID</label>
          <input 
            type="text" 
            name="userId" 
            placeholder="Search User..." 
            value={filters.userId} 
            onChange={handleFilterChange}
            className="block bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Level</label>
          <select 
            name="level" 
            value={filters.level} 
            onChange={handleFilterChange}
            className="block bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Levels</option>
            {[0,1,2,3,4,5,6,7,8,9].map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={fetchData}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ml-auto"
        >
          Apply Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User / Sponsor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rebirth / Lvl</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-medium">Loading ledger data...</td>
                </tr>
              ) : ledgerData.ledger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-medium">No transactions found matching your criteria.</td>
                </tr>
              ) : (
                ledgerData.ledger.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">{item.mainUserId?.memberId}</span>
                        <span className="text-[10px] text-slate-400">Ref: {item.sponsorUserId?.memberId || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getTypeBadgeColor(item.type)}`}>
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-indigo-600">{item.completedRebirthId?.nodeCode || "-"}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Level {item.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${item.type.includes('CREDIT') || item.type.includes('COMPLETED') ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {formatCurrency(item.amount)}
                      </span>
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
};

export default AutoPoolFundPage;
