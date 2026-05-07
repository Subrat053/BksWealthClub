import { Menu } from "lucide-react";

export default function AdminHeader({ adminSession, onMenuClick }) {
  const adminId = adminSession?.adminId || adminSession?.displayName || "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#071436]/75 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-4">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden" onClick={onMenuClick} aria-label="Open admin menu">
          <Menu size={24} />
        </button>
        <span className="text-lg font-bold text-white lg:hidden">Admin</span>
      </div>
      <div className="flex items-center gap-3 text-white">
        <div className="flex flex-col items-end mr-1">
          <span className="text-xs font-medium text-white/90">{adminId}</span>
          {adminSession?.sponsorId && (
            <span className="text-[10px] text-emerald-400 font-mono tracking-wider">{adminSession.sponsorId}</span>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
          <div className="h-full w-full rounded-[10px] bg-[#071436] flex items-center justify-center font-bold text-xs">
            {adminId.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
