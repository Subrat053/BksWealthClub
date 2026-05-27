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
      <div className="px-5 py-6 flex items-center justify-center border-b border-[#1F2937] mb-4">
        {/* <p className="text-[11px] uppercase tracking-[0.2em] text-[#F4B860]">
          Control Center
        </p>
        <p className="text-xl font-bold text-white">BksWealthClub Admin</p> */}
        <img src="/bks_logo.png" alt="logo" className="h-10 object-contain" />
      </div>
      {adminSession?.sponsorId && (
        <div className="px-5 pb-4">
          <div className="rounded-xl border border-[#1F2937] bg-[#1F2937]/30 p-3 text-center">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
                Refer ID
              </p>
              <p className="text-xs font-mono font-semibold text-[#F4B860]">
                {adminSession.sponsorId}
              </p>
            </div>
          </div>
        </div>
      )}
      <nav className="space-y-2 px-3 pb-6">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#F4B860] text-[#111827] shadow-sm font-semibold"
                    : "text-[#E5E7EB] hover:bg-[#1F2937] hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-[#111827]" : "text-[#F4B860]"} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-[280px] overflow-y-auto border-r border-[#1F2937] bg-[#111827] shadow-lg">
        {sidebar}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto border-r border-[#1F2937] bg-[#111827] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
    </>
  );
}
