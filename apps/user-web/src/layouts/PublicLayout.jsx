import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";
import PublicFooter from "../components/layout/PublicFooter";

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(105deg,#021139_0%,#052c55_48%,#0d476f_100%)] text-white">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-[12%] h-[460px] w-[460px] rounded-full bg-blue-500/30 blur-3xl" />
      <PublicNavbar />
      <main className="relative mx-auto ">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
