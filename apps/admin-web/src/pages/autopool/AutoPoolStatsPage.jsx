import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";

const AutoPoolStatsPage = () => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    pendingEntries: 0,
    placedEntries: 0,
    completedEntries: 0,
    totalRebirths: 0,
    queueWaiting: 0,
    queueProcessing: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const data = await autopoolService.getStats();
    setStats(data);
    setLoading(false);
  };

  const statCards = [
    { title: "Total Entries", value: stats.totalEntries, icon: "📋", color: "blue" },
    { title: "Pending Queue", value: stats.pendingEntries, icon: "⏳", color: "amber" },
    { title: "Placed Nodes", value: stats.placedEntries, icon: "🏗️", color: "indigo" },
    { title: "Completed Nodes", value: stats.completedEntries, icon: "✅", color: "emerald" },
    { title: "Total Rebirths", value: stats.totalRebirths, icon: "♻️", color: "purple" },
    { title: "Queue Waiting", value: stats.queueWaiting, icon: "🕒", color: "slate" },
    { title: "Queue Processing", value: stats.queueProcessing, icon: "⚙️", color: "slate" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Auto Pool Statistics" 
        subtitle="Global overview of the Auto Pool system performance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Queue Actions</h3>
          <p className="text-slate-500 text-sm">System logs and real-time activities for the Auto Pool system.</p>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs text-slate-400 italic">
            Monitoring active...
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Rebirth Performance</h3>
          <p className="text-slate-500 text-sm">Total Rebirth IDs generated: {stats.totalRebirths}</p>
          <div className="mt-4 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500" 
              style={{ width: `${Math.min(100, (stats.totalRebirths / (stats.totalEntries || 1)) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Percentage of total entries created via rebirth cycle</p>
        </div>
      </div>
    </div>
  );
};

export default AutoPoolStatsPage;
