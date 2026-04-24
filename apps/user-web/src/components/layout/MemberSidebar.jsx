import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { memberNav } from "../../config/nav.config";
import { useAuth } from "../../hooks/useAuth";

export default function MemberSidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({ Team: true, Withdrawal: true, Incomes: true });
  const memberId = user?.memberId || user?.username || "MEMBER";
  const memberStatus = (user?.status || "Inactive").toLowerCase();
  const statusClass = memberStatus === "active" ? "text-emerald-300" : "text-red-300";

  const sidebarContent = (
    <>
      

      
      <div className="px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/90">Member Panel</p>
        <p className="mt-2 text-2xl font-bold">BksWealthClub</p>
      </div>

      <div className="px-6 pb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-300">Member ID</p>
          <p className="mt-1 text-lg font-semibold">{memberId}</p>
          <p className={`mt-1 text-xs capitalize ${statusClass}`}>Status: {memberStatus}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {memberNav.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const activeChild = item.children.some((child) => location.pathname === child.path);
            return (
              <div key={item.label} className="mb-2">
                <button
                  onClick={() => setOpenMenus((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                    activeChild ? "bg-[#162457]" : "hover:bg-[#101d49]"
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span className="rounded-full bg-[#111b43] p-2">{Icon && <Icon size={16} />}</span>
                    {item.label}
                  </span>
                  <ChevronDown size={16} className={`transition ${openMenus[item.label] ? "rotate-180" : ""}`} />
                </button>

                {openMenus[item.label] && (
                  <div className="ml-10 mt-2 space-y-2">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block rounded-md px-2 py-1 text-sm ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-[#162457]" : "hover:bg-[#101d49]"
                }`
              }
            >
              <span className="rounded-full bg-[#111b43] p-2">{Icon && <Icon size={16} />}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
    </>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:shrink-0 lg:flex-col bg-[#020d2e] text-white shadow-2xl">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <>
          <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-label="Close menu" />
          <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col bg-[#020d2e] text-white lg:hidden">
            {sidebarContent}
          </aside>
        </>
      ) : null}
    </>
  );
}
