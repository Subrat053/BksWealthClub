import PageHeader from "../../components/common/PageHeader";
import SummaryCard from "../../components/common/SummaryCard";

import AdminPageHeader from "../../components/layout/AdminPageHeader";
import SectionCard from "../../components/SectionCard";
import StatCard from "../../components/StatCard";
import {dashboardStats, recentActivities} from "../../config/data";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      {/* <PageHeader title="Admin Dashboard" subtitle="Operational summary of platform activity" /> */}
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

      {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Users" value="0" />
        <SummaryCard label="Pending Deposits" value="0" />
        <SummaryCard label="Pending Withdrawals" value="0" />
        <SummaryCard label="Open Tickets" value="0" />
      </div> */}
    </div>
  );
}
