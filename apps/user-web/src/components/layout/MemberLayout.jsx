import { Outlet } from "react-router-dom";
import { useState } from "react";
import MemberHeader from "./MemberHeader";
import MemberSidebar from "./MemberSidebar";

export default function MemberLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#111827] selection:bg-[#F4B860]/30">
      <div className="flex min-h-screen items-start overflow-hidden">
        <MemberSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex flex-1 flex-col lg:ml-68 min-w-0">
          <MemberHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="px-4 py-6 lg:px-8 pb-8 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
