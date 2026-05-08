import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import SectionCard from "../../components/SectionCard";
import StatCard from "../../components/StatCard";
import { dashboardStats, recentActivities } from "../../config/data";
import { adminIncomeService } from "../../services/adminIncome.service";

function FundMiniCard({ title, amount, emoji, color }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span>
        <p className="text-xs font-medium text-blue-100/60">{title}</p>
      </div>
      <h4 className={`text-2xl font-bold ${color}`}>
        ${amount?.toFixed(2) || "0.00"}
      </h4>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [funds, setFunds] = useState(null);

  useEffect(() => {
    adminIncomeService.getFundsSummary()
      .then((res) => setFunds(res?.data || null))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Monitor business growth, users, activity, and overall performance."
        primaryActionText="Add Service"
        secondaryActionText="Export Report"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <StatCard key={item.id} {...item} />
        ))}
      </div>

      {/* ── Fund Summary Cards ─────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Superadmin Funds</h2>
          <a
            href="/admin/funds"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10 transition"
          >
            View Details
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <FundMiniCard
            title="Company Fund"
            amount={funds?.companyFund}
            emoji="🏢"
            color="text-blue-300"
          />
          <FundMiniCard
            title="Admin Fund"
            amount={funds?.adminFund}
            emoji="🔑"
            color="text-amber-300"
          />
          <FundMiniCard
            title="Achiever Fund"
            amount={funds?.achieverFund}
            emoji="🏆"
            color="text-purple-300"
          />
          <FundMiniCard
            title="Leftover Fund"
            amount={funds?.leftoverFund}
            emoji="📦"
            color="text-orange-300"
          />
          <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <p className="text-xs font-medium text-emerald-200/70">Total Fund</p>
            </div>
            <h4 className="text-2xl font-bold text-emerald-300">
              ${funds?.totalSuperAdminFund?.toFixed(2) || "0.00"}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">User Growth</h2>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              View
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-[20px] border border-white/10 bg-[#0c1f57]/70 text-sm text-blue-100/60">
            Chart Area
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Revenue Overview</h2>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              View
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-[20px] border border-white/10 bg-[#0c1f57]/70 text-sm text-blue-100/60">
            Chart Area
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-3">
            {["Create User", "Manage CMS", "Upload Media", "Send Notification"].map((item) => (
              <button
                key={item}
                className="rounded-[18px] border border-white/10 bg-[#0c1f57]/70 p-4 text-left text-sm font-semibold text-blue-50 transition hover:bg-[#102767]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activities</h2>
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4 transition hover:bg-[#102767]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">{activity.title}</h3>
                  <p className="mt-1 text-sm text-blue-100/70">{activity.description}</p>
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-blue-200/55">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
