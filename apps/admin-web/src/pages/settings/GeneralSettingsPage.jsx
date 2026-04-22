import PageHeader from "../../components/common/PageHeader";


import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { settingsData } from "../../config/data";


export default function GeneralSettingsPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Settings"
        subtitle="Manage platform configuration, contact details, API endpoints, and security."
        primaryActionText="Save Settings"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">General Settings</h2>

          <div className="mt-5 grid gap-4">
            <input
              defaultValue={settingsData.siteName}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
            <input
              defaultValue={settingsData.siteEmail}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
            <input
              defaultValue={settingsData.supportPhone}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
            <input
              defaultValue={settingsData.address}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-lg font-semibold text-white">Security & Integration</h2>

          <div className="mt-5 grid gap-4">
            <input
              defaultValue={settingsData.cloudinaryCloudName}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />
            <input
              defaultValue={settingsData.apiBaseUrl}
              className="rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-sm text-white outline-none"
            />

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1f57]/70 px-4 py-3">
              <span className="text-sm text-blue-100/85">Maintenance Mode</span>
              <input type="checkbox" defaultChecked={settingsData.maintenanceMode} />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1f57]/70 px-4 py-3">
              <span className="text-sm text-blue-100/85">Two Factor Authentication</span>
              <input type="checkbox" defaultChecked={settingsData.twoFactorAuth} />
            </label>

            <button className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2944a8]">
              Update Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
