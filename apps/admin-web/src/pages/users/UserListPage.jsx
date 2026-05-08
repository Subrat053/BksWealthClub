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
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1a50] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">View Password</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          ⚠️ <strong>Security Warning:</strong> This reveals the user's
          plain-text password stored at registration or last reset. Handle with
          extreme care.
        </div>

        <div className="mb-4 space-y-1 text-sm">
          <p className="text-blue-100/60">
            User: <span className="font-medium text-white">{user.name}</span>
          </p>
          <p className="text-blue-100/60">
            ID: <span className="font-mono text-white">{user.id}</span>
          </p>
        </div>

        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={loading}
            className="w-full rounded-xl bg-[#1e327d] py-3 text-sm font-semibold text-white transition hover:bg-[#2944a8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Fetching…" : "🔑 Show Password"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#06112e] px-4 py-3">
              <span className="flex-1 font-mono text-sm text-emerald-300 break-all">
                {password}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
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
          <p className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
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
    <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
      ✓ Verified
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300">
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
        key: "memberId",
        label: "USER ID",
        render: (_value, row) => (
          <span className="font-mono text-xs text-cyan-200">
            {row.memberId || "—"}
          </span>
        ),
      },

      {
        key: "type",
        label: "TYPE",
        render: (_value, row) =>
          row.isRebirth ? (
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/15 px-2 py-0.5 text-xs font-medium text-cyan-300">
              Rebirth
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-slate-400/30 bg-slate-400/15 px-2 py-0.5 text-xs font-medium text-slate-300">
              User
            </span>
          ),
      },
      {
        key: "displayLabel",
        label: "MEMBER",
        render: (_value, row) => (
          <div className="flex flex-col">
            <span
              className={
                row.isRebirth
                  ? "font-bold text-cyan-300"
                  : "font-semibold text-white"
              }
            >
              {row.displayLabel}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {row.memberId || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "wallet",
        label: "FUNDS",
        render: (_value, row) => (
          <div className="flex flex-col gap-1 text-xs">
            {row.isRebirth ? (
              <span className="text-cyan-300">
                RB Wallet: ${row.walletBalance}
              </span>
            ) : (
              <span className="text-emerald-300">
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
        key: "status",
        label: "STATUS",
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: "joinedAt",
        label: "CREATED",
        render: (_value, row) => new Date(row.createdAt).toLocaleDateString(),
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
        title="Users & Rebirth IDs"
        subtitle="Manage users, rebirth accounts, status, roles, and account access."
        primaryActionText="Add User"
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
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value }))
          }
          className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="all">All Types</option>
          <option value="users">Normal Users</option>
          <option value="rebirths">Rebirth Accounts</option>
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
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-blue-50 hover:bg-white/10"
                  onClick={() => navigate(`/admin/users/${row._id}`)}
                >
                  View
                </button>

                <button
                  className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                  onClick={() => setPasswordModalUser(row)}
                >
                  🔑 Password
                </button>

                {/* Send Verification Link */}
                {!row.isEmailVerified && (
                  <button
                    className="rounded-lg border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleSendVerification(row)}
                    disabled={verifyingId === row._id}
                  >
                    {verifyingId === row._id ? "Sending…" : "✉ Verify Email"}
                  </button>
                )}

                <button
                  className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => handleBanUser(row)}
                  disabled={row.status === "blocked"}
                >
                  {row.status === "blocked" ? "Banned" : "Ban"}
                </button>

                <button
                  className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

      {loading && <p className="text-sm text-blue-100/70">Loading users…</p>}
    </div>
  );
}
