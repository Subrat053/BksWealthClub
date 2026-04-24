import { Outlet } from "react-router-dom";
import { useState } from "react";
import MemberHeader from "./MemberHeader";
import MemberSidebar from "./MemberSidebar";

export default function MemberLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#07122d] via-[#102567] to-[#243f9b]">
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="relative flex min-h-screen items-start ">
        <MemberSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-h-screen  bg-red-300 lg:w-full">
          <MemberHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="px-4 pb-8 lg:px-8 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
