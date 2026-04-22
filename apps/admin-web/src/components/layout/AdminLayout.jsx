import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminPageHeader from "./AdminPageHeader";
import { defaultAdminSession } from "../../config/adminSession.config";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminSession] = useState(defaultAdminSession);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#07122d] via-[#102567] to-[#243f9b] text-white">
      <div className="flex min-h-screen ">
        <AdminSidebar adminSession={adminSession} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="lg:ml-[280px] w-full">
          <AdminHeader adminSession={adminSession} onMenuClick={() => setMobileOpen(true)} />
          {/* <AdminPageHeader title="Dashboard" subtitle="Welcome to your admin dashboard" /> */}
          <main className="px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
