import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getUserDetails, updateUserStatus } from "../../api/user.api";
import StatusBadge from "../../components/StatusBadge";

export default function UserDetailsPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;
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

  if (loading) return <div className="p-10 text-center text-blue-100/60">Loading user details...</div>;
  if (error) return <div className="p-10 text-center text-red-400">{error}</div>;
  if (!user) return <div className="p-10 text-center text-blue-100/60">User not found.</div>;

  return (
    <div className="space-y-5">
      <PageHeader 
        title="User Details" 
        subtitle={`Viewing profile for ${user.fullName}`} 
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Snapshot */}
        <section className="col-span-2 rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            <StatusBadge status={user.status} />
          </div>
          
          <div className="grid gap-y-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-blue-200/50">Full Name</p>
              <p className="font-medium text-white">{user.fullName}</p>
            </div>
            <div>
              <p className="text-blue-200/50">User ID (Member ID)</p>
              <p className="font-mono font-medium text-emerald-400">{user.memberId}</p>
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
              <p className="font-mono font-medium text-blue-300">{user.sponsorId}</p>
            </div>
            <div>
              <p className="text-blue-200/50">Registration Source</p>
              <p className="font-medium capitalize text-white">{user.registrationSource || "Web"}</p>
            </div>
            <div>
              <p className="text-blue-200/50">Email Verified</p>
              <p className={user.isEmailVerified ? "text-emerald-400" : "text-red-400"}>
                {user.isEmailVerified ? "Verified" : "Not Verified"}
              </p>
            </div>
            <div>
              <p className="text-blue-200/50">Joined On</p>
              <p className="font-medium text-white">
                {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-semibold text-white">Admin Actions</h3>
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
            {user.status === "inactive" && (
              <button 
                disabled={updating}
                onClick={() => handleUpdateStatus("active")}
                className="w-full rounded-xl bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition disabled:opacity-50"
              >
                Approve User
              </button>
            )}
          </div>
          
          <div className="mt-8 rounded-2xl bg-white/5 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200/40">Security Status</h4>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-100/60">2FA Enabled</span>
                <span className={user.twoFactorEnabled ? "text-emerald-400" : "text-slate-400"}>
                  {user.twoFactorEnabled ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-100/60">Account Locked</span>
                <span className={user.isSuspended ? "text-red-400" : "text-emerald-400"}>
                  {user.isSuspended ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
