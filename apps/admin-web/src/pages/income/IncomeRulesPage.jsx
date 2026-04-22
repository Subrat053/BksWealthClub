import PageHeader from "../../components/common/PageHeader";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";
const incomeRules = [
  {
    id: "RULE001",
    title: "Direct Referral Income",
    description: "User receives direct sponsor bonus on every new joining under referral link.",
    percentage: "10%",
    trigger: "On Registration",
    status: "active",
  },
  {
    id: "RULE002",
    title: "Level Income",
    description: "Multi-level commission is credited based on downline business activity.",
    percentage: "5%",
    trigger: "On Activation",
    status: "active",
  },
  {
    id: "RULE003",
    title: "Autopool Cycle Bonus",
    description: "Pool income is distributed when cycle conditions are completed.",
    percentage: "Fixed ₹1,500",
    trigger: "On Cycle Completion",
    status: "pending",
  },
];



export default function IncomeRulesPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Income Rules"
        subtitle="Configure plan logic, percentage settings, and income distribution rules."
        primaryActionText="Add Rule"
        secondaryActionText="Sync Plan"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Create / Edit Rule</h2>

          <div className="mt-5 grid gap-4">
            <input
              type="text"
              placeholder="Rule Title"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />
            <textarea
              rows="5"
              placeholder="Rule Description"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />
            <input
              type="text"
              placeholder="Percentage / Fixed Value"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />
            <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
              <option>Select Trigger</option>
              <option>On Registration</option>
              <option>On Activation</option>
              <option>On Cycle Completion</option>
            </select>

            <div className="flex gap-3">
              <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]">
                Save Rule
              </button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-blue-50 hover:bg-white/10">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-5 text-lg font-semibold text-white">Existing Rules</h2>

          <div className="space-y-4">
            {incomeRules.map((item) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-white/10 bg-[#0c1f57]/70 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-blue-100/70">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-100/65">
                      <span>Value: {item.percentage}</span>
                      <span>Trigger: {item.trigger}</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                    Edit
                  </button>
                  <button className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
