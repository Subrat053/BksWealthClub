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
            className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          >
            <p className="text-sm font-medium text-blue-100/70">{item.label}</p>
            <h3 className="mt-3 text-3xl font-bold text-white">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-white">USERNAME</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">POOL</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">CYCLE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">POSITION</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">PAYOUT</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">STATUS</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {autopoolEntries.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.username}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.poolName}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.cycle}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.position}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.payout}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                        View
                      </button>
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
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
