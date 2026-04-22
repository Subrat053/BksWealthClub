import PageHeader from "../../components/common/PageHeader";

import AdminPageHeader from "../../components/layout/AdminPageHeader";

const referralSummary = [
  { label: "Total Referrals", value: 128 },
  { label: "Active Members", value: 94 },
  { label: "Direct Sponsors", value: 18 },
  { label: "Team Volume", value: "₹4,52,000" },
];

const referralLevels = [
  { id: 1, level: "Level 1", members: 8, active: 7, commission: "₹12,400" },
  { id: 2, level: "Level 2", members: 16, active: 13, commission: "₹21,900" },
  { id: 3, level: "Level 3", members: 32, active: 24, commission: "₹36,500" },
  { id: 4, level: "Level 4", members: 72, active: 50, commission: "₹48,200" },
];


export default function TeamTreePage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Referral Tree"
        subtitle="Monitor genealogy structure, referral levels, and sponsor hierarchy."
        primaryActionText="Export Tree"
        secondaryActionText="Search Member"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {referralSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          >
            <p className="text-sm font-medium text-blue-100/70">{item.label}</p>
            <h3 className="mt-3 text-3xl font-bold text-white">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tree Visualization</h2>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              Expand All
            </button>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-6">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-2xl border border-blue-400/20 bg-[#1e327d] px-6 py-4 text-center shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-100/60">Root User</p>
                <h3 className="mt-1 text-lg font-bold text-white">ADMIN001</h3>
              </div>

              <div className="grid w-full gap-4 md:grid-cols-3">
                {["USR101", "USR102", "USR103"].map((user) => (
                  <div
                    key={user}
                    className="rounded-2xl border border-white/10 bg-[#08173f] px-4 py-4 text-center"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-100/55">Direct</p>
                    <h4 className="mt-1 font-semibold text-white">{user}</h4>
                    <p className="mt-1 text-xs text-blue-100/65">3 Downlines</p>
                  </div>
                ))}
              </div>

              <div className="grid w-full gap-4 md:grid-cols-4">
                {["USR201", "USR202", "USR203", "USR204"].map((user) => (
                  <div
                    key={user}
                    className="rounded-2xl border border-white/10 bg-[#08173f] px-4 py-4 text-center"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-100/55">Level 2</p>
                    <h4 className="mt-1 font-semibold text-white">{user}</h4>
                    <p className="mt-1 text-xs text-blue-100/65">Active</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">Level Summary</h2>

          <div className="space-y-4">
            {referralLevels.map((item) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.level}</h3>
                    <p className="mt-1 text-sm text-blue-100/70">
                      Members: {item.members} · Active: {item.active}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {item.commission}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
