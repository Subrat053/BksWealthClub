import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
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
      <div className="p-10 text-center text-slate-400 font-medium">
        Loading user details...
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-xl m-4">{error}</div>;
  if (!user)
    return (
      <div className="p-10 text-center text-slate-400 font-medium">User not found.</div>
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
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          &larr; Back to Users
        </button>
      </div>
      <AdminPageHeader
        title="User Details"
        subtitle={`Viewing profile for ${user.fullName}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Snapshot */}
        <section className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Profile Information
            </h3>
            <StatusBadge status={user.status} />
          </div>

          <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-inner">
            {user.isAliasAccount ? "ALIAS USER" : "MAIN USER"}
          </div>

          <div className="grid gap-y-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</p>
              <p className="font-semibold text-slate-800">{user.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">User ID (Member ID)</p>
              <p className="font-mono font-bold text-[#E8A13F]">
                {user.memberId}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</p>
              <p className="font-semibold text-slate-800">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</p>
              <p className="font-semibold text-slate-800">{user.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sponsor ID</p>
              <p className="font-mono font-bold text-slate-700">
                {user.sponsorId}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sponsored By ID</p>
              <p className="font-mono font-bold text-slate-700">
                {sponsoredById}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sponsored By Name</p>
              <p className="font-semibold text-slate-800">{sponsoredByName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registration Source</p>
              <p className="font-semibold capitalize text-slate-800">
                {user.registrationSource || "Web"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Verified</p>
              <p
                className={`font-bold ${
                  user.isEmailVerified ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {user.isEmailVerified ? "Verified" : "Not Verified"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Joined On</p>
              <p className="font-semibold text-slate-650">
                {new Date(user.createdAt).toLocaleDateString()}{" "}
                {new Date(user.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-slate-900">
            Admin Actions
          </h3>
          <div className="flex flex-col gap-3">
            {user.status !== "active" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("active")}
                className="w-full rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50 shadow-sm"
              >
                Activate / Approve
              </button>
            )}
            {user.status !== "suspended" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("suspended")}
                className="w-full rounded-xl bg-amber-50 py-3 text-sm font-bold text-amber-700 border border-amber-250 hover:bg-amber-100 transition disabled:opacity-50 shadow-sm"
              >
                Suspend Account
              </button>
            )}
            {user.status !== "blocked" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("blocked")}
                className="w-full rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50 shadow-sm"
              >
                Block User
              </button>
            )}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Security Status
            </h4>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">2FA Enabled</span>
                <span
                  className={`font-bold ${
                    user.twoFactorEnabled
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {user.twoFactorEnabled ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Account Locked</span>
                <span
                  className={`font-bold ${
                    user.isSuspended ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {user.isSuspended ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {aliases.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Alias / Upgrade IDs</h3>
            <span className="rounded-full border border-[#F4B860]/20 bg-[#FFF4E5] px-3 py-1 text-xs font-bold text-[#E8A13F]">
              {aliases.length} alias record(s)
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aliases.map((alias) => (
              <div key={alias._id} className="rounded-2xl border border-slate-150 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Alias Member ID</p>
                    <p className="font-mono font-bold text-[#E8A13F]">{alias.aliasMemberId || alias.aliasId}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    {alias.status || "ACTIVE"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-650">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Level</p>
                    <p className="font-bold text-slate-800">{alias.createdFromAutopoolLevel ?? alias.sourceAutopoolLevel}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Sponsor</p>
                    <p className="font-mono font-bold text-[#E8A13F]">{alias.sponsorId || user.sponsorId || "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Deduction</p>
                    <p className="font-bold text-rose-600">${Number(alias.deductionAmount || 75).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Auto Deposit</p>
                    <p className="font-bold text-emerald-600">$75.00</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Rebirths</p>
                    <p className="font-bold text-slate-800">{(alias.aliasRebirthIds || []).length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Created</p>
                    <p className="font-semibold text-slate-600">{formatDate(alias.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wallet & Income Section ──────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/20 transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Withdrawable Fund
          </p>
          <h4 className="mt-2 text-3xl font-black text-emerald-600">
            ${w.withdrawableFund?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/20 transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fund Wallet
          </p>
          <h4 className="mt-2 text-3xl font-black text-[#E8A13F]">
            ${w.fundWallet?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/20 transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Wallet
          </p>
          <h4 className="mt-2 text-3xl font-black text-slate-800">
            ${w.mainWallet?.toFixed(2) || "0.00"}
          </h4>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F4B860]/20 transition">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Rebirth Balance
          </p>
          <h4 className="mt-2 text-3xl font-black text-purple-700">
            ${w.totalRebirthBalance?.toFixed(2) || "0.00"}
          </h4>
        </div>
      </div>

      {/* Rebirth IDs */}
      {rebirths.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Rebirth IDs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
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
                      className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rebirths.map((rb) => (
                  <tr key={rb._id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#E8A13F]">
                      {rb.rebirthUserId || rb.rebirthCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                      {rb.ownerMemberId ||
                        summaryUserProfile.memberId ||
                        user.memberId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                      {rb.sponsorId || sponsoredById}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-750">
                      {rb.sponsorName || sponsoredByName}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                      ${rb.walletBalance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Income Breakdown
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(incomeByType).map(([type, data]) => (
              <div
                key={type}
                className="rounded-xl border border-slate-150 bg-slate-50 p-4"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {type.replace(/_/g, " ")}
                </p>
                <p className="mt-1.5 text-xl font-black text-[#E8A13F]">
                  ${data.total?.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  {data.count} transaction(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Income Logs */}
      {recentLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Recent Income Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Date", "From", "Type", "Amount", "Remarks"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-[#E8A13F]">
                      {log.fromUserId?.memberId || "System"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-semibold">
                      {log.type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                      ${log.amount}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium max-w-[200px] truncate">
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
