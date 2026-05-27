import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { memberNav } from "../../config/nav.config";
import { useAuth } from "../../hooks/useAuth";

export default function MemberSidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    Team: true,
    Withdrawal: true,
    Incomes: true,
  });
  const memberId = user?.memberId || user?.username || "MEMBER";
  const memberStatus = (user?.status || "Inactive").toLowerCase();
  const statusClass =
    memberStatus === "active" ? "text-emerald-300" : "text-red-300";

  const sidebarContent = (
    <>
      <div className="px-6 py-4 flex items-center justify-center border-b border-[#1F2937] mb-4">
        {/* <p className="text-[11px] uppercase tracking-[0.24em] text-[#F4B860]">
          Member Panel
        </p>
        <p className="mt-2 text-2xl font-bold">BksWealthClub</p> */}
        <img src="/bks_logo.png" alt="logo" className="h-10 object-contain" />
      </div>

      <div className="px-6 pb-4">
        <div className="rounded-xl border border-[#1F2937] bg-[#1F2937]/30 p-4 shadow-sm text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
            Member ID
          </p>
          <p className="mt-1 text-base font-semibold text-white">{memberId}</p>
          <p className={`mt-1 text-xs capitalize ${statusClass} font-medium`}>
            Status: {memberStatus}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
        {memberNav.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const activeChild = item.children.some(
              (child) => location.pathname === child.path,
            );
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() =>
                    setOpenMenus((prev) => ({
                      ...prev,
                      [item.label]: !prev[item.label],
                    }))
                  }
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition duration-200 ${
                    activeChild
                      ? "bg-[#1F2937]/50 text-white font-semibold"
                      : "text-[#E5E7EB] hover:bg-[#1F2937]"
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm">
                    <span className={`rounded-lg p-1.5 ${activeChild ? "bg-[#F4B860] text-[#111827]" : "bg-[#1F2937] text-[#F4B860]"}`}>
                      {Icon && <Icon size={14} />}
                    </span>
                    {item.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${openMenus[item.label] ? "rotate-180" : ""}`}
                  />
                </button>

                {openMenus[item.label] && (
                  <div className="ml-10 space-y-1 py-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-xs transition duration-200 ${
                            isActive
                              ? "bg-[#F4B860] text-[#111827] font-semibold"
                              : "text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]/30"
                          }`
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
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${
                  isActive
                    ? "bg-[#F4B860] text-[#111827] shadow-sm font-semibold"
                    : "text-[#E5E7EB] hover:bg-[#1F2937] hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-lg p-1.5 transition ${isActive ? "bg-[#111827] text-[#F4B860]" : "bg-[#1F2937] text-[#F4B860]"}`}>
                    {Icon && <Icon size={14} />}
                  </span>
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
      <aside className="hidden lg:fixed lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:shrink-0 lg:flex-col border-r border-[#1F2937] bg-[#111827] text-white shadow-lg">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <>
          <button
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={onClose}
            aria-label="Close menu"
          />
          <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-[#1F2937] bg-[#111827] text-white lg:hidden">
            {sidebarContent}
          </aside>
        </>
      ) : null}
    </>
  );
}
