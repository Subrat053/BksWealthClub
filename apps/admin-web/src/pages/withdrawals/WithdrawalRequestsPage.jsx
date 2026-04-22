import PageHeader from "../../components/common/PageHeader";
import AdminTable from "../../components/common/AdminTable";

import AdminPageHeader from "../../components/layout/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";


const withdrawals = [
  {
    id: "WDR001",
    username: "john_smith",
    amount: 12000,
    charges: 250,
    payable: 11750,
    status: "pending",
  },
  {
    id: "WDR002",
    username: "priya_dev",
    amount: 8500,
    charges: 150,
    payable: 8350,
    status: "success",
  },
  {
    id: "WDR003",
    username: "alex_roy",
    amount: 15000,
    charges: 300,
    payable: 14700,
    status: "failed",
  },
];


const columns = [
  { key: "username", label: "Username" },
  { key: "amount", label: "Amount" },
  { key: "charges", label: "Charges" },
  { key: "payable", label: "Payable" },
  { key: "status", label: "Status" },
];

export default function WithdrawalRequestsPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Withdrawal Requests"
        subtitle="Review, verify, and process payout requests."
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
                <th className="px-5 py-4 text-sm font-semibold text-white">CHARGES</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">PAYABLE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">STATUS</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {withdrawals.length > 0 ? (
                withdrawals.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-sm text-blue-100/85">{item.username}</td>
                    <td className="px-5 py-4 text-sm text-blue-100/85">₹{item.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-blue-100/85">₹{item.charges.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-blue-100/85">₹{item.payable.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-blue-100/85">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
                          Approve
                        </button>
                        <button className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-sm text-blue-100/65">
                    No withdrawal requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
