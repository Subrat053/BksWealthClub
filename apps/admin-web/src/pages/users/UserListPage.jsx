import AdminPageHeader from "../../components/layout/AdminPageHeader";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../hooks/useUsers";
import {
  resetUserTwoFactor,
  updateUserStatus,
  getUserPassword,
  sendVerificationLink,
} from "../../api/user.api";
import { adminIncomeService } from "../../services/adminIncome.service";
import CreateUserModal from "./CreateUserModal";
import DownloadReportButton from "../../components/common/DownloadReportButton";

// ─── Password Modal ────────────────────────────────────────────────────────────
function PasswordModal({ user, onClose }) {
  const [password, setPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(null);

  const handleReveal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserPassword(user._id);
      const plain = res?.data?.data?.plainPassword;
      if (plain) {
        setPassword(plain);
        setRevealed(true);
      } else {
        setError("Password not stored for this user.");
      }
    } catch {
      setError("Failed to fetch password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">View Password</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          ⚠️ <strong>Security Warning:</strong> This reveals the user's
          plain-text password stored at registration or last reset. Handle with
          extreme care.
        </div>

        <div className="mb-4 space-y-1 text-sm">
          <p className="text-slate-500 font-semibold">
            User: <span className="font-bold text-slate-800">{user.name}</span>
          </p>
          <p className="text-slate-500 font-semibold">
            ID: <span className="font-mono font-bold text-slate-800">{user.id}</span>
          </p>
        </div>

        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={loading}
            className="w-full rounded-xl bg-[#111827] py-3 text-sm font-bold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-slate-100"
          >
            {loading ? "Fetching…" : "🔑 Show Password"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="flex-1 font-mono text-sm text-emerald-600 font-bold break-all">
                {password}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              Password shown once per session. Close this dialog when done.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 font-semibold">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Email Verified Badge ──────────────────────────────────────────────────────
function EmailVerifiedBadge({ verified }) {
  if (verified === undefined || verified === null)
    return <span className="text-slate-500 text-xs">—</span>;
  return verified ? (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
      ✓ Verified
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
      ✗ Not Verified
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UserListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "all",
  });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [mergedUsers, setMergedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchUsersWithRebirths = async () => {
    setLoading(true);
    try {
      const res = await adminIncomeService.getUsersWithRebirths(filters);
      setMergedUsers(res?.data?.users || []);
    } catch (err) {
      console.error(err);
      setMergedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithRebirths();
  }, [filters]);

  const handleSendVerification = async (row) => {
    if (row.isEmailVerified || row.isRebirth) return;
    setVerifyingId(row._id);
    try {
      await sendVerificationLink(row._id);
      alert(`Verification email sent to ${row.email}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to send verification link.";
      alert(msg);
    } finally {
      setVerifyingId(null);
    }
  };

  const columns2 = useMemo(
    () => [
      {
        key: "serialNo",
        label: "S.NO",
        render: (_value, _row, index) => (
          <span className="font-bold text-slate-500">
            {index + 1}
          </span>
        ),
      },
      {
        key: "memberId",
        label: "USER ID",
        render: (_value, row) => (
          <span className="font-mono text-xs font-bold text-[#E8A13F]">
            {row.memberId || "—"}
          </span>
        ),
      },

      {
        key: "type",
        label: "TYPE",
        render: (_value, row) =>
          row.isRebirth ? (
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">
              Rebirth
            </span>
          ) : row.isAliasAccount ? (
            <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700">
              Alias
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600">
              Main Account
            </span>
          ),
      },
      {
        key: "displayLabel",
        label: "MEMBER",
        render: (_value, row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={
                  row.isRebirth
                    ? "font-extrabold text-cyan-700"
                    : "font-semibold text-slate-800"
                }
              >
                {row.displayLabel}
              </span>
              {row.isAliasAccount && (
                <span className="inline-flex rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                  Alias
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-slate-400">
              {row.memberId || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "linkedAccount",
        label: "LINKED ROOT",
        render: (_value, row) => {
          if (row.isAliasAccount) {
            return (
              <div className="flex flex-col text-xs">
                <span className="text-purple-700 font-mono font-bold">
                  {row.rootOwnerAccountId || row.aliasOfAccountId || "—"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Via Round {row.currentCompletedAutopoolRound !== undefined && row.currentCompletedAutopoolRound !== -1 ? row.currentCompletedAutopoolRound : "0"}
                </span>
              </div>
            );
          }
          return <span className="text-slate-500 text-xs">—</span>;
        }
      },
      {
        key: "currentCompletedAutopoolRound",
        label: "AUTOPOOL ROUND",
        render: (_value, row) => {
          if (row.isRebirth) {
            return <span className="text-xs text-[#9CA3AF]">—</span>;
          }

          const round = row.currentCompletedAutopoolRound;

          if (round === undefined || round === null || round === -1) {
            return (
              <span className="inline-flex rounded-full border border-[#F4B860]/40 bg-[#FFF4E5] px-2.5 py-1 text-xs font-semibold text-[#E8A13F]">
                Pending Round 0
              </span>
            );
          }

          return (
            <span className="inline-flex rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-semibold text-[#10B981]">
              Round {round} Completed
            </span>
          );
        },
      },
      {
        key: "rebirthCount",
        label: "REBIRTHS",
        render: (_value, row) => {
          if (row.isRebirth) return <span className="text-slate-500 text-xs">—</span>;
          return (
            <span className="font-semibold text-slate-700">
              {row.rebirthCount || 0} rebirths
            </span>
          );
        }
      },
      {
        key: "wallet",
        label: "FUNDS",
        render: (_value, row) => (
          <div className="flex flex-col gap-1 text-xs">
            {row.isRebirth ? (
              <span className="text-cyan-700 font-bold">
                RB Wallet: ${row.walletBalance}
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">
                Withdrawable: ${row.withdrawableFund}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "sponsorId",
        label: "SPONSOR ID",
        render: (v) => v || "System",
      },
      {
        key: "sponsorName",
        label: "SPONSORED BY",
        render: (v) => v || "System",
      },
      {
        key: "email",
        label: "EMAIL ADDRESS",
        render: (value) => value || "—",
      },
      {
        key: "isEmailVerified",
        label: "EMAIL VERIFIED",
        render: (value, row) =>
          row.isRebirth ? (
            <span className="text-slate-500">—</span>
          ) : (
            <EmailVerifiedBadge verified={value} />
          ),
      },
      {
        key: "activationStatus",
        label: "ACTIVATION",
        render: (value, row) =>
          row.isRebirth ? (
            <span className="text-slate-500">—</span>
          ) : (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${value === "ACTIVE" ? "border border-emerald-250 bg-emerald-50 text-emerald-700" :
                value === "PENDING_DEPOSIT" ? "border border-[#F4B860]/45 bg-[#FFF4E5] text-[#E8A13F]" :
                  "border border-slate-200 bg-slate-50 text-slate-500"
              }`}>
              {value ? value.replace("_", " ") : "PENDING"}
            </span>
          ),
      },
      {
        key: "status",
        label: "STATUS",
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: "joinedAt",
        label: "CREATED",
        render: (_value, row) => {
          if (!row.createdAt) return "—";
          const date = new Date(row.createdAt);
          const d = String(date.getDate()).padStart(2, "0");
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const y = String(date.getFullYear()).slice(-2);
          const hh = String(date.getHours()).padStart(2, "0");
          const mm = String(date.getMinutes()).padStart(2, "0");
          const ss = String(date.getSeconds()).padStart(2, "0");
          const ms = String(date.getMilliseconds()).padStart(3, "0");
          return `${d}-${m}-${y} ${hh}:${mm}:${ss}.${ms}`;
        },
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
    )
      return;
    await updateUserStatus(row._id, "blocked");
    fetchUsersWithRebirths();
  };

  const handleResetTwoFactor = async (row) => {
    if (!row.twoFactorEnabled) return;
    if (
      !confirm(`Reset 2FA for ${row.name}? They will need to set it up again.`)
    )
      return;
    await resetUserTwoFactor(row._id);
    fetchUsersWithRebirths();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Users List"
        subtitle="Manage users, status, roles, and account access."
        primaryActionText="Add User"
        onPrimaryClick={() => setShowModal(true)}
      >
        <DownloadReportButton
          data={mergedUsers}
          fileName="users-report"
          sheetName="Users"
          label="Download User List"
          columns={[
            { header: "User ID", key: "memberId" },
            { header: "Name", key: "fullName" },
            { header: "Username", key: "username" },
            { header: "Email", key: "email" },
            { header: "Phone", key: "phone" },
            { header: "Sponsor ID", key: "sponsorId" },
            { header: "Sponsor Name", key: "sponsorName" },
            { header: "Wallet Balance", key: "walletBalance" },
            { header: "Withdrawable", key: "withdrawableFund" },
            { header: "Status", key: "status", format: "capitalize" },
            { header: "Created At", key: "createdAt", format: "date" },
          ]}
        />
      </AdminPageHeader>
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email or member ID..."
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition cursor-pointer shadow-sm font-semibold"
        >
          <option value="" className="bg-white">All Status</option>
          <option value="approved" className="bg-white">Approved</option>
          <option value="active" className="bg-white">Active</option>
          <option value="blocked" className="bg-white">Blocked</option>
          <option value="pending" className="bg-white">Pending</option>
          <option value="inactive" className="bg-white">Inactive</option>
          <option value="suspended" className="bg-white">Suspended</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value }))
          }
          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition cursor-pointer shadow-sm font-semibold"
        >
          <option value="all" className="bg-white">All Accounts</option>
          <option value="main" className="bg-white">Main Users</option>
          <option value="alias" className="bg-white">Alias Accounts</option>
          <option value="all">All Accounts</option>
          <option value="main">Main Users</option>
          <option value="alias">Alias Accounts</option>
        </select>
      </div>

      <DataTable
        columns={columns2}
        data={mergedUsers}
        renderActions={(row) => (
          <div className="flex flex-wrap gap-2">
            {!row.isRebirth && (
              <>
                <button
                  className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                  onClick={() => navigate(`/admin/users/${row._id}`)}
                >
                  View
                </button>

                <button
                  className="px-3.5 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition shadow-sm"
                  onClick={() => setPasswordModalUser(row)}
                >
                  🔑 Password
                </button>

                {/* Send Verification Link */}
                {!row.isEmailVerified && (
                  <button
                    className="px-3.5 py-1.5 border border-sky-200 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleSendVerification(row)}
                    disabled={verifyingId === row._id}
                  >
                    {verifyingId === row._id ? "Sending…" : "✉ Verify Email"}
                  </button>
                )}

                <button
                  className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => handleBanUser(row)}
                  disabled={row.status === "blocked"}
                >
                  {row.status === "blocked" ? "Banned" : "Ban"}
                </button>

                <button
                  className="px-3.5 py-1.5 border border-[#F4B860]/40 bg-[#FFF4E5] text-[#E8A13F] rounded-lg text-xs font-bold hover:bg-[#FFF4E5]/80 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => handleResetTwoFactor(row)}
                  disabled={!row.twoFactorEnabled}
                >
                  {row.twoFactorEnabled ? "Reset 2FA" : "2FA Off"}
                </button>
              </>
            )}
            {row.isRebirth && (
              <span className="text-xs text-slate-500 italic">
                No actions for Rebirth IDs
              </span>
            )}
          </div>
        )}
      />

      <CreateUserModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchUsersWithRebirths}
      />

      {passwordModalUser && (
        <PasswordModal
          user={passwordModalUser}
          onClose={() => setPasswordModalUser(null)}
        />
      )}

      {loading && <p className="text-sm text-slate-500 font-medium">Loading users…</p>}
    </div>
  );
}
