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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Create / Edit Rule</h2>

          <div className="mt-5 grid gap-4">
            <input
              type="text"
              placeholder="Rule Title"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm font-semibold"
            />
            <textarea
              rows="5"
              placeholder="Rule Description"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm font-semibold"
            />
            <input
              type="text"
              placeholder="Percentage / Fixed Value"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm font-semibold"
            />
            <select className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition cursor-pointer shadow-sm font-semibold">
              <option className="bg-white">Select Trigger</option>
              <option className="bg-white">On Registration</option>
              <option className="bg-white">On Activation</option>
              <option className="bg-white">On Cycle Completion</option>
            </select>

            <div className="flex gap-3">
              <button className="rounded-xl bg-[#111827] hover:bg-[#1F2937] px-4 py-3 text-sm font-bold text-white transition shadow-md shadow-slate-100">
                Save Rule
              </button>
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Existing Rules</h2>

          <div className="space-y-4">
            {incomeRules.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-150 bg-slate-50 p-4 hover:border-[#F4B860]/30 transition duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-550 font-medium">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400 font-bold">
                      <span>Value: {item.percentage}</span>
                      <span>Trigger: {item.trigger}</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 transition shadow-sm" style={{ padding: '0.375rem 0.875rem' }}>
                    Edit
                  </button>
                  <button className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm" style={{ padding: '0.375rem 0.875rem' }}>
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
