import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";

const incomeLogs = [
  {
    id: "INC001",
    username: "john_smith",
    type: "Referral Income",
    amount: "₹850",
    source: "USR209",
    date: "2026-04-20",
    status: "success",
  },
  {
    id: "INC002",
    username: "priya_dev",
    type: "Autopool Income",
    amount: "₹1,500",
    source: "Gold Pool",
    date: "2026-04-19",
    status: "success",
  },
  {
    id: "INC003",
    username: "alex_roy",
    type: "Level Income",
    amount: "₹420",
    source: "USR404",
    date: "2026-04-18",
    status: "pending",
  },
];



const columns = [
  { key: "username", label: "Username" },
  { key: "type", label: "Income Type" },
  { key: "amount", label: "Amount" },
  { key: "date", label: "Date" },
];

export default function IncomeLogsPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Income Logs"
        subtitle="Review credited income entries across referral, level, and autopool plans."
        primaryActionText="Export Logs"
        secondaryActionText="Filter Logs"
      />

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:grid-cols-5">
        <input
          type="text"
          placeholder="Search username"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
        />
        <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
          <option>All Types</option>
          <option>Referral Income</option>
          <option>Level Income</option>
          <option>Autopool Income</option>
        </select>
        <input
          type="date"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        />
        <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
          <option>All Status</option>
          <option>Success</option>
          <option>Pending</option>
        </select>
        <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]">
          Apply Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-white">USERNAME</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">TYPE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">AMOUNT</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">SOURCE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">DATE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">STATUS</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {incomeLogs.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.username}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.type}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.amount}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.source}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.date}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
