import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";

const deposits = [
  {
    id: "DEP001",
    username: "aarav_01",
    amount: 10000,
    method: "UPI",
    txnId: "TXN908123",
    status: "success",
  },
  {
    id: "DEP002",
    username: "rohan_22",
    amount: 5000,
    method: "Bank Transfer",
    txnId: "TXN908124",
    status: "pending",
  },
];

const columns = [
  { key: "username", label: "Username" },
  { key: "amount", label: "Amount" },
  { key: "txHash", label: "Transaction Hash" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default function DepositRequestsPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Deposits"
        subtitle="Track submitted deposits and payment verification status."
        primaryActionText="Export"
        secondaryActionText="Filter"
      />

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-white">USERNAME</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">AMOUNT</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">METHOD</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">TXN ID</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">STATUS</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {deposits.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.username}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">₹{item.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.method}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.txnId}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                        View
                      </button>
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                        Verify
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
