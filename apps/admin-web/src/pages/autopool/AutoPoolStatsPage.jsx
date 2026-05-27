import React, { useEffect, useState } from "react";
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

    try {
      const data = await autopoolService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Entries",
      value: stats.totalEntries,
      icon: "📋",
      badge: "All records",
    },
    {
      title: "Pending Queue",
      value: stats.pendingEntries,
      icon: "⏳",
      badge: "Waiting",
    },
    {
      title: "Placed Nodes",
      value: stats.placedEntries,
      icon: "🏗️",
      badge: "Placed",
    },
    {
      title: "Completed Nodes",
      value: stats.completedEntries,
      icon: "✅",
      badge: "Completed",
    },
    {
      title: "Total Rebirths",
      value: stats.totalRebirths,
      icon: "♻️",
      badge: "Rebirths",
    },
    {
      title: "Queue Waiting",
      value: stats.queueWaiting,
      icon: "🕒",
      badge: "Queue",
    },
    {
      title: "Queue Processing",
      value: stats.queueProcessing,
      icon: "⚙️",
      badge: "Live",
    },
  ];

  const rebirthPercentage = Math.min(
    100,
    (stats.totalRebirths / (stats.totalEntries || 1)) * 100,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auto Pool Statistics"
        subtitle="Global overview of the Auto Pool system performance"
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="
              rounded-2xl
              border
              border-[#E5E7EB]
              bg-white
              p-5
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-[2px]
              hover:border-[#F4B860]/50
              hover:bg-[#FFF4E5]
              hover:shadow-md
            "
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E5] text-xl">
                {card.icon}
              </div>

              <span className="rounded-full border border-[#F4B860]/40 bg-[#FFF4E5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#E8A13F]">
                {card.badge}
              </span>
            </div>

            <h3 className="text-sm font-medium text-[#6B7280]">
              {card.title}
            </h3>

            <p className="mt-1 text-2xl font-bold text-[#111827]">
              {loading ? "..." : card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#111827]">
              Recent Queue Actions
            </h3>

            <span className="rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-semibold text-[#E8A13F]">
              Live
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[#6B7280]">
            System logs and real-time activities for the Auto Pool system.
          </p>

          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-xs italic text-[#9CA3AF]">
            Monitoring active...
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#111827]">
              Rebirth Performance
            </h3>

            <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-[#10B981]">
              {rebirthPercentage.toFixed(1)}%
            </span>
          </div>

          <p className="text-sm text-[#6B7280]">
            Total Rebirth IDs generated:{" "}
            <span className="font-semibold text-[#111827]">
              {stats.totalRebirths}
            </span>
          </p>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#F4B860] transition-all duration-500"
              style={{ width: `${rebirthPercentage}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-[#9CA3AF]">
            Percentage of total entries created via rebirth cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
export default AutoPoolStatsPage;