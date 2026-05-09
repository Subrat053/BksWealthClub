import { NavLink, useNavigate } from "react-router-dom";
import { adminNav } from "../../config/admin.nav.config";
import { useAuth } from "../../context/useAuth";

export default function AdminSidebar({ adminSession, mobileOpen, onClose }) {
  const { logout } = useAuth();
  const adminId = adminSession?.adminId || adminSession?.displayName || "ADMIN";
  const adminRole = adminSession?.role || "admin";
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item.label === "Logout") {
      logout();
      navigate("/login", { replace: true });
      return;
    }
    if (onClose) onClose();
  };

  const sidebar = (
    <>
      <div className="px-5 py-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/90">
          Control Center
        </p>
        <p className="text-xl font-bold text-white">BksWealthClub Admin</p>
      </div>
      <div className="px-5 pb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
            Admin
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{adminId}</p>
          <p className="mt-1 text-xs capitalize text-cyan-200">
            Role: {adminRole}
          </p>
          {adminSession?.sponsorId && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-white/5 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Refer ID
              </p>
              <p className="text-xs font-mono font-medium text-emerald-400">
                {adminSession.sponsorId}
              </p>
            </div>
          )}
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
                  isActive
                    ? "bg-[#162457] text-white"
                    : "text-slate-300 hover:bg-[#101d49] hover:text-white"
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-[280px] overflow-y-auto border-r border-white/10 bg-[#020d2e] shadow-2xl">
        {sidebar}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#020d2e] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
    </>
  );
}
