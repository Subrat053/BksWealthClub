import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import SectionCard from "../../components/SectionCard";
import StatCard from "../../components/StatCard";
import { adminIncomeService } from "../../services/adminIncome.service";
import { adminService } from "../../services/admin.service";
import DownloadReportButton from "../../components/common/DownloadReportButton";

function FundMiniCard({ title, amount, emoji }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span>
        <p className="text-xs font-semibold text-[#6B7280]">{title}</p>
      </div>
      <h4 className="text-2xl font-black text-[#111827]">
        ${amount?.toFixed(2) || "0.00"}
      </h4>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [funds, setFunds] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersForExport, setUsersForExport] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, fundsRes, usersRes] = await Promise.all([
          adminService.getDashboardSummary(),
          adminIncomeService.getFundsSummary(),
          adminIncomeService.getUsersWithRebirths({ type: "all" }),
        ]);
        setSummary(summaryRes || {});
        setFunds(fundsRes?.data || null);
        setUsersForExport(usersRes?.data?.users || []);
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
      >
        <DownloadReportButton
          data={usersForExport}
          fileName="all-users-report"
          sheetName="All Users"
          label="Download User List"
          columns={[
            { header: "User ID", key: "memberId" },
            { header: "Name", key: "fullName" },
            { header: "Username", key: "username" },
            { header: "Email", key: "email" },
            { header: "Phone", key: "phone" },
            { header: "Sponsor ID", key: "sponsorId" },
            { header: "Sponsor Name", key: "sponsorName" },
            { header: "Wallet Balance", key: "walletBalance" },
            { header: "Withdrawable", key: "withdrawableFund" },
            { header: "Status", key: "status", format: "capitalize" },
            { header: "Created At", key: "createdAt", format: "date" },
          ]}
        />
      </AdminPageHeader>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-[#9CA3AF]">
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
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">Superadmin Funds</h2>
          <a
            href="/admin/funds"
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] transition shadow-sm"
          >
            View Details
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <FundMiniCard
            title="Company Fund"
            amount={funds?.companyFund}
            emoji="🏢"
          />
          <FundMiniCard
            title="Admin Fund"
            amount={funds?.adminFund}
            emoji="🔑"
          />
          <FundMiniCard
            title="Achiever Fund"
            amount={funds?.achieverFund}
            emoji="🏆"
          />
          <FundMiniCard
            title="Leftover Fund"
            amount={funds?.leftoverFund}
            emoji="📦"
          />
          <div className="rounded-2xl border border-[#10B981]/25 bg-[#ECFDF5] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <p className="text-xs font-semibold text-[#047857]">
                Total Fund
              </p>
            </div>
            <h4 className="text-2xl font-black text-[#065F46]">
              ${funds?.totalSuperAdminFund?.toFixed(2) || "0.00"}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111827]">User Growth</h2>
            <button className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] transition">
              View
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] text-sm font-semibold text-[#6B7280]">
            Chart Area
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111827]">
              Revenue Overview
            </h2>
            <button className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] transition">
              View
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] text-sm font-semibold text-[#6B7280]">
            Chart Area
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-[#111827]">
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
                className="rounded-2xl border border-[#E5E7EB] bg-[#FFF4E5]/40 p-4 text-left text-sm font-bold text-[#111827] transition hover:bg-[#FFF4E5] hover:border-[#F4B860]/40 hover:scale-[1.01] duration-200"
              >
                {item}
              </button>
            ))}
            <DownloadReportButton
              data={usersForExport}
              fileName="all-users-report"
              sheetName="All Users"
              label="Quick Export: User List"
              className="w-full !justify-start !p-4 !rounded-2xl !bg-[#FFF4E5]/40 !border-[#E5E7EB] hover:!bg-[#FFF4E5] hover:!border-[#F4B860]/40 text-[#111827] font-bold duration-200 hover:scale-[1.01]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">
            Recent Activities
          </h2>
          <button className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] transition">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-[#9CA3AF]">
              Loading activities...
            </div>
          ) : summary?.recentActivities &&
            summary.recentActivities.length > 0 ? (
            summary.recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:bg-[#FFF4E5]/30 hover:border-[#F4B860]/20 hover:scale-[1.005] duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#111827]">
                      {activity.action || "Action"}: {activity.targetType || ""}
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {activity.details || `Admin: ${activity.adminId || ""}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-semibold text-[#9CA3AF]">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#9CA3AF]">
              No recent activities
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
