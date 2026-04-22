import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import AdminTable from "../../components/common/AdminTable";

import AdminPageHeader from "../../components/layout/AdminPageHeader";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { users } from "../../config/data";

const columns = [
  { key: "username", label: "Username" },
  { key: "sponsor", label: "Sponsor" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined" },
];

const columns2 = [
  { key: "id", label: "USER ID" },
  { key: "name", label: "NAME" },
  { key: "email", label: "EMAIL" },
  { key: "phone", label: "PHONE" },
  { key: "role", label: "ROLE" },
  {
    key: "status",
    label: "STATUS",
    render: (value) => <StatusBadge status={value} />,
  },
  { key: "joinedAt", label: "JOINED" },
];

export default function UserListPage() {
  return (
    <div className="space-y-5">
      {/* <PageHeader title="Users List" subtitle="Search, filter, and manage member accounts" /> */}
      <AdminPageHeader
        title="Users"
        subtitle="Manage users, status, roles, and account access."
        primaryActionText="Add User"
        secondaryActionText="Import Users"
      />
      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:grid-cols-4">
        <input
          type="text"
          placeholder="Search by name or email"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none focus:border-blue-400/40"
        />
        <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
          <option>All Status</option>
          <option>Active</option>
          <option>Blocked</option>
          <option>Pending</option>
        </select>
        <select className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none">
          <option>All Roles</option>
          <option>Customer</option>
          <option>Subscriber</option>
        </select>
        <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2944a8]">
          Apply Filters
        </button>
      </div>

      <DataTable
        columns={columns2}
        data={users}
        renderActions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              View
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10">
              Edit
            </button>
            <button className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20">
              {row.status === "blocked" ? "Unblock" : "Block"}
            </button>
          </div>
        )}
      />
      <FilterBar>
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="Search username" />
        <select className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none">
          <option>All Status</option>
        </select>
        <button className="h-11 rounded-lg bg-gradient-to-r from-[#3f63db] to-[#33c0d7] text-sm font-semibold">Apply Filters</button>
      </FilterBar>
      <AdminTable columns={columns} rows={[]} emptyText="No users found" />
    </div>
  );
}
