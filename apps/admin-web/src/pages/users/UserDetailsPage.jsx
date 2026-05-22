import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getUserDetails, updateUserStatus } from "../../api/user.api";
import { adminIncomeService } from "../../services/adminIncome.service";
import StatusBadge from "../../components/StatusBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [incomeSummary, setIncomeSummary] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getUserDetails(id);
      setUser(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch user details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeSummary = async () => {
    try {
      const res = await adminIncomeService.getUserIncomeSummary(id);
      setIncomeSummary(res?.data || null);
    } catch {
      // Silently fail — income data is supplementary
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
      fetchIncomeSummary();
    }
  }, [id]);

  const handleUpdateStatus = async (status) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`))
      return;
    try {
      setUpdating(true);
      await updateUserStatus(id, status);
      await fetchUser();
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-blue-100/60">
        Loading user details...
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-red-400">{error}</div>;
  if (!user)
    return (
      <div className="p-10 text-center text-blue-100/60">User not found.</div>
    );

  const w = incomeSummary?.wallet || {};
  const rebirths = incomeSummary?.rebirths || [];
  const incomeByType = incomeSummary?.incomeByType || {};
  const recentLogs = incomeSummary?.recentLogs || [];
  const summaryUserProfile = incomeSummary?.userProfile || {};
  const aliases = user.aliases || [];

  const sponsoredByUser = user.referredByUserId || user.sponsorUserId || null;
  const sponsoredByName =
    summaryUserProfile.sponsorName || sponsoredByUser?.fullName || "System";
  const sponsoredById =
    summaryUserProfile.sponsorId ||
    sponsoredByUser?.memberId ||
    user.sponsorId ||
    "System";

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          &larr; Back to Users
        </button>
      </div>
      <PageHeader
        title="User Details"
        subtitle={`Viewing profile for ${user.fullName}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Snapshot */}
        <section className="col-span-2 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Profile Information
            </h3>
            <StatusBadge status={user.status} />
          </div>

          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            {user.isAliasAccount ? "ALIAS USER" : "MAIN USER"}
          </div>

          <div className="grid gap-y-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-blue-200/50">Full Name</p>
              <p className="font-medium text-white">{user.fullName}</p>
            </div>
            <div>
              <p className="text-blue-200/50">User ID (Member ID)</p>
              <p className="font-mono font-medium text-emerald-400">
                {user.memberId}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Email Address</p>
              <p className="font-medium text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-blue-200/50">Phone Number</p>
              <p className="font-medium text-white">{user.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-blue-200/50">Sponsor ID</p>
              <p className="font-mono font-medium text-blue-300">
                {user.sponsorId}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Sponsored By ID</p>
              <p className="font-mono font-medium text-cyan-300">
                {sponsoredById}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Sponsored By Name</p>
              <p className="font-medium text-white">{sponsoredByName}</p>
            </div>
            <div>
              <p className="text-blue-200/50">Registration Source</p>
              <p className="font-medium capitalize text-white">
                {user.registrationSource || "Web"}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Email Verified</p>
              <p
                className={
                  user.isEmailVerified ? "text-emerald-400" : "text-red-400"
                }
              >
                {user.isEmailVerified ? "Verified" : "Not Verified"}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Joined On</p>
              <p className="font-medium text-white">
                {new Date(user.createdAt).toLocaleDateString()}{" "}
                {new Date(user.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-semibold text-white">
            Admin Actions
          </h3>
          <div className="flex flex-col gap-3">
            {user.status !== "active" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("active")}
                className="w-full rounded-xl bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition disabled:opacity-50"
              >
                Activate / Approve
              </button>
            )}
            {user.status !== "suspended" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("suspended")}
                className="w-full rounded-xl bg-amber-500/10 py-3 text-sm font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition disabled:opacity-50"
              >
                Suspend Account
              </button>
            )}
            {user.status !== "blocked" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("blocked")}
                className="w-full rounded-xl bg-red-500/10 py-3 text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                Block User
              </button>
            )}
          </div>

          <div className="mt-8 rounded-2xl bg-white/5 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200/40">
              Security Status
            </h4>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-100/60">2FA Enabled</span>
                <span
                  className={
                    user.twoFactorEnabled
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }
                >
                  {user.twoFactorEnabled ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-100/60">Account Locked</span>
                <span
                  className={
                    user.isSuspended ? "text-red-400" : "text-emerald-400"
                  }
                >
                  {user.isSuspended ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {aliases.length > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Alias / Upgrade IDs</h3>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              {aliases.length} alias record(s)
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aliases.map((alias) => (
              <div key={alias._id} className="rounded-2xl border border-white/10 bg-[#0c1f57]/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Alias Member ID</p>
                    <p className="font-mono font-bold text-cyan-300">{alias.aliasMemberId || alias.aliasId}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                    {alias.status || "ACTIVE"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <p className="text-slate-500">Level</p>
                    <p className="font-semibold text-white">{alias.createdFromAutopoolLevel ?? alias.sourceAutopoolLevel}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sponsor</p>
                    <p className="font-mono font-semibold text-amber-300">{alias.sponsorId || user.sponsorId || "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Deduction</p>
                    <p className="font-semibold text-rose-300">${Number(alias.deductionAmount || 75).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Auto Deposit</p>
                    <p className="font-semibold text-emerald-300">$75.00</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Rebirths</p>
                    <p className="font-semibold text-cyan-300">{(alias.aliasRebirthIds || []).length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="font-semibold text-white">{formatDate(alias.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wallet & Income Section ──────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-blue-100/50">
            Withdrawable Fund
          </p>
          <h4 className="mt-2 text-3xl font-bold text-emerald-300">
            ${w.withdrawableFund?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-blue-100/50">
            Fund Wallet
          </p>
          <h4 className="mt-2 text-3xl font-bold text-cyan-300">
            ${w.fundWallet?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-blue-100/50">
            Main Wallet
          </p>
          <h4 className="mt-2 text-3xl font-bold text-blue-300">
            ${w.mainWallet?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/70 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-blue-100/50">
            Total Rebirth Balance
          </p>
          <h4 className="mt-2 text-3xl font-bold text-purple-300">
            ${w.totalRebirthBalance?.toFixed(2) || "0.00"}
          </h4>
        </div>
      </div>

      {/* Rebirth IDs */}
      {rebirths.length > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Rebirth IDs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#112766]/70">
                <tr>
                  {[
                    "Rebirth User ID",
                    "Parent User ID",
                    "Sponsored By ID",
                    "Sponsored By Name",
                    "Wallet Balance",
                    "Created",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rebirths.map((rb) => (
                  <tr key={rb._id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-300">
                      {rb.rebirthUserId || rb.rebirthCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-200">
                      {rb.ownerMemberId ||
                        summaryUserProfile.memberId ||
                        user.memberId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-300">
                      {rb.sponsorId || sponsoredById}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">
                      {rb.sponsorName || sponsoredByName}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-300">
                      ${rb.walletBalance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(rb.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Income Breakdown by Type */}
      {Object.keys(incomeByType).length > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Income Breakdown
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(incomeByType).map(([type, data]) => (
              <div
                key={type}
                className="rounded-[18px] border border-white/10 bg-[#0c1f57]/70 p-4"
              >
                <p className="text-xs text-slate-400 uppercase">
                  {type.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  ${data.total?.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  {data.count} transaction(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Income Logs */}
      {recentLogs.length > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recent Income Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#112766]/70">
                <tr>
                  {["Date", "From", "Type", "Amount", "Remarks"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-cyan-300">
                      {log.fromUserId?.memberId || "System"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {log.type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-300">
                      ${log.amount}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                      {log.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
