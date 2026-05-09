import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import SectionCard from "../../components/SectionCard";
import StatCard from "../../components/StatCard";
import { adminIncomeService } from "../../services/adminIncome.service";
import { adminService } from "../../services/admin.service";

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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, fundsRes] = await Promise.all([
          adminService.getDashboardSummary(),
          adminIncomeService.getFundsSummary(),
        ]);
        setSummary(summaryRes || {});
        setFunds(fundsRes?.data || null);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-400">
            Loading stats...
          </div>
        ) : (
          <>
            <StatCard
              id={1}
              title="Total Users"
              value={summary?.users || 0}
              change={"+0%"}
              trend="neutral"
            />
            <StatCard
              id={2}
              title="Pending Deposits"
              value={summary?.pendingDeposits || 0}
              change={"+0%"}
              trend="neutral"
            />
            <StatCard
              id={3}
              title="Pending Withdrawals"
              value={summary?.pendingWithdrawals || 0}
              change={"+0%"}
              trend="neutral"
            />
            <StatCard
              id={4}
              title="Open Support Tickets"
              value={summary?.openTickets || 0}
              change={"+0%"}
              trend="neutral"
            />
          </>
        )}
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
              <p className="text-xs font-medium text-emerald-200/70">
                Total Fund
              </p>
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
            <h2 className="text-lg font-semibold text-white">
              Revenue Overview
            </h2>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              View
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-[20px] border border-white/10 bg-[#0c1f57]/70 text-sm text-blue-100/60">
            Chart Area
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            {[
              "Create User",
              "Manage CMS",
              "Upload Media",
              "Send Notification",
            ].map((item) => (
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
          <h2 className="text-lg font-semibold text-white">
            Recent Activities
          </h2>
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              Loading activities...
            </div>
          ) : summary?.recentActivities &&
            summary.recentActivities.length > 0 ? (
            summary.recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4 transition hover:bg-[#102767]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      {activity.action || "Action"}: {activity.targetType || ""}
                    </h3>
                    <p className="mt-1 text-sm text-blue-100/70">
                      {activity.details || `Admin: ${activity.adminId || ""}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium text-blue-200/55">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              No recent activities
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
