import { NavLink, useNavigate } from "react-router-dom";
import { adminNav } from "../../config/admin.nav.config";

export default function AdminSidebar({ adminSession, mobileOpen, onClose }) {
  const adminId = adminSession?.adminId || adminSession?.displayName || "ADMIN";
  const adminRole = adminSession?.role || "admin";
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item.label === "Logout") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      navigate("/login", { replace: true });
      return;
    }
    if (onClose) onClose();
  };

  const sidebar = (
    <>
      <div className="px-5 py-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/90">Control Center</p>
        <p className="text-xl font-bold text-white">BksWealthClub Admin</p>
      </div>
      <div className="px-5 pb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Admin</p>
          <p className="mt-1 text-sm font-semibold text-white">{adminId}</p>
          <p className="mt-1 text-xs capitalize text-cyan-200">Role: {adminRole}</p>
        </div>
      </div>
      <nav className="space-y-1 px-3 pb-6">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-[#162457] text-white" : "text-slate-300 hover:bg-[#101d49] hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:top-0 lg:block lg:h-screen lg:w-[280px] lg:shrink-0 overflow-y-auto border-r border-white/10 bg-[#020d2e]">{sidebar}</aside>
      {mobileOpen ? (
        <>
          <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-label="Close admin menu" />
          <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-white/10 bg-[#020d2e] lg:hidden">{sidebar}</aside>
        </>
      ) : null}
    </>
  );
}
