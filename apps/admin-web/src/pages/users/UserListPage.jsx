import AdminPageHeader from "../../components/layout/AdminPageHeader";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../hooks/useUsers";
import { updateUserStatus } from "../../api/user.api";
import CreateUserModal from "./CreateUserModal";

export default function UserListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const { users, loading, refetch } = useUsers(filters);
  const [showModal, setShowModal] = useState(false);

  const columns2 = useMemo(
    () => [
      { key: "id", label: "USER ID" },
      { key: "name", label: "NAME" },
      { key: "email", label: "EMAIL" },
      { key: "phone", label: "PHONE" },
      // { key: "role", label: "ROLE" },
      {
        key: "status",
        label: "STATUS",
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: "joinedAt",
        label: "JOINED",
        render: (_value, row) => row.joinedAtExact || "-",
      },
    ],
    [],
  );

  const handleBanUser = async (row) => {
    if (row.status === "blocked") return;
    if (
      !confirm(
        `Ban user ${row.name}? This is a soft ban and keeps data in database.`,
      )
    ) {
      return;
    }

    await updateUserStatus(row._id, "blocked");
    refetch();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Users"
        subtitle="Manage users, status, roles, and account access."
        primaryActionText="Add User"
        // secondaryActionText="Import Users"
        onPrimaryClick={() => setShowModal(true)}
      />
      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:grid-cols-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          placeholder="Search by name or email"
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none focus:border-blue-400/40"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2944a8]"
          onClick={refetch}
        >
          Apply Filters
        </button>
      </div>

      <DataTable
        columns={columns2}
        data={users}
        renderActions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10"
              onClick={() => navigate(`/admin/users/${row._id}`)}
            >
              View
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10"
              onClick={() => navigate(`/admin/users/${row._id}?mode=edit`)}
            >
              Edit
            </button>
            <button
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleBanUser(row)}
              disabled={row.status === "blocked"}
            >
              {row.status === "blocked" ? "Banned" : "Ban"}
            </button>
          </div>
        )}
      />
      <CreateUserModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetch}
      />
      {/* <FilterBar>
        <input className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none" placeholder="Search username" />
        <select className="h-11 rounded-lg bg-[#2d3440] px-4 text-sm outline-none">
          <option>All Status</option>
        </select>
        <button className="h-11 rounded-lg bg-gradient-to-r from-[#3f63db] to-[#33c0d7] text-sm font-semibold">Apply Filters</button>
      </FilterBar>
      <AdminTable columns={columns} rows={[]} emptyText="No users found" /> */}
      {loading && <p className="text-sm text-blue-100/70">Loading users...</p>}
    </div>
  );
}
