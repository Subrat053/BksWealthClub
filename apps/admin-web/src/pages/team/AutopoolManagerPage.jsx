import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";

const poolStats = [
  { label: "Total Pool Members", value: 426 },
  { label: "Open Cycles", value: 28 },
  { label: "Completed Cycles", value: 112 },
  { label: "Pool Payout", value: "₹3,18,700" },
];

const autopoolEntries = [
  {
    id: "APL001",
    username: "rahul_01",
    poolName: "Silver Pool",
    cycle: "Cycle 04",
    position: 3,
    payout: "₹1,200",
    status: "active",
  },
  {
    id: "APL002",
    username: "neha_11",
    poolName: "Gold Pool",
    cycle: "Cycle 02",
    position: 1,
    payout: "₹2,500",
    status: "pending",
  },
  {
    id: "APL003",
    username: "vikas_09",
    poolName: "Starter Pool",
    cycle: "Cycle 07",
    position: 5,
    payout: "₹900",
    status: "inactive",
  },
];

const columns = [
  { key: "queueId", label: "Queue ID" },
  { key: "username", label: "Username" },
  { key: "position", label: "Position" },
  { key: "rebirth", label: "Rebirth" },
];

export default function AutopoolManagerPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Autopool"
        subtitle="Track autopool positions, rotations, completed cycles, and payouts."
        primaryActionText="Create Pool"
        secondaryActionText="Export Data"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {poolStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/40 transition duration-300"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">USERNAME</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">POOL</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CYCLE</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">POSITION</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">PAYOUT</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {autopoolEntries.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{item.username}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{item.poolName}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{item.cycle}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{item.position}</td>
                  <td className="px-5 py-4 text-sm font-black text-slate-800">{item.payout}</td>
                  <td className="px-5 py-4 text-sm">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                        View
                      </button>
                      <button className="px-3.5 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-bold hover:bg-[#1F2937] transition shadow-sm">
                        Rotate
                      </button>
                    </div>
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
