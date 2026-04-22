import PageHeader from "../../components/common/PageHeader";

import AdminPageHeader from "../../components/layout/AdminPageHeader";
const loginActivity = [
  { id: 1, user: "ADMIN001", device: "Windows Chrome", ip: "192.168.1.12", time: "2026-04-22 10:34 AM", status: "Success" },
  { id: 2, user: "ADMIN001", device: "Android Chrome", ip: "192.168.1.18", time: "2026-04-21 08:10 PM", status: "Success" },
  { id: 3, user: "EDITOR003", device: "Mac Safari", ip: "192.168.1.27", time: "2026-04-20 07:21 PM", status: "Failed" },
];

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Security"
        subtitle="Manage authentication, login history, access control, and protection settings."
        primaryActionText="Update Security"
        secondaryActionText="Download Logs"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Security Controls</h2>

          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1f57]/70 px-4 py-3">
              <span className="text-sm text-blue-100/85">Enable Two-Factor Authentication</span>
              <input type="checkbox" defaultChecked />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1f57]/70 px-4 py-3">
              <span className="text-sm text-blue-100/85">Force Strong Password Policy</span>
              <input type="checkbox" defaultChecked />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1f57]/70 px-4 py-3">
              <span className="text-sm text-blue-100/85">Restrict Multiple Device Login</span>
              <input type="checkbox" />
            </label>

            <input
              type="number"
              placeholder="Session Timeout (minutes)"
              defaultValue={30}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />

            <input
              type="text"
              placeholder="Allowed Admin IP Range"
              defaultValue="192.168.1.0/24"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Change Password</h2>

          <div className="mt-5 grid gap-4">
            <input
              type="password"
              placeholder="Current Password"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />
            <input
              type="password"
              placeholder="New Password"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white placeholder:text-blue-200/40 outline-none"
            />

            <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]">
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#112766]/70">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-white">USER</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">DEVICE</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">IP ADDRESS</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">TIME</th>
                <th className="px-5 py-4 text-sm font-semibold text-white">STATUS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loginActivity.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.user}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.device}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.ip}</td>
                  <td className="px-5 py-4 text-sm text-blue-100/85">{item.time}</td>
                  <td className="px-5 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Success"
                          ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                          : "border border-red-400/20 bg-red-500/15 text-red-300"
                      }`}
                    >
                      {item.status}
                    </span>
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
