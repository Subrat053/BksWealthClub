import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";
import PublicFooter from "../components/layout/PublicFooter";

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-800">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[#F4B860]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-[12%] h-[460px] w-[460px] rounded-full bg-[#F4B860]/15 blur-3xl" />
      <PublicNavbar />
      <main className="relative mx-auto">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
