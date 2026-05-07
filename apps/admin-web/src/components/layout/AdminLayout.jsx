import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminPageHeader from "./AdminPageHeader";
import { defaultAdminSession } from "../../config/adminSession.config";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminSession] = useState(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : defaultAdminSession;
  });

  return (
    <div className="min-h-screen bg-[#07122d] text-white selection:bg-blue-500/30">
      <div className="flex min-h-screen">
        {/* Sidebar Overlay for mobile */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMobileOpen(false)}
        />

        <AdminSidebar adminSession={adminSession} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex flex-1 flex-col lg:ml-[280px] min-w-0">
          <AdminHeader adminSession={adminSession} onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-1 max-w-full overflow-x-hidden">
            <div className="mx-auto max-w-8xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
