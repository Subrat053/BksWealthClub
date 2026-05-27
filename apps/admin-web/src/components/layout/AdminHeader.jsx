import { Menu } from "lucide-react";

export default function AdminHeader({ adminSession, onMenuClick }) {
  const adminId = adminSession?.adminId || adminSession?.displayName || "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 shadow-sm lg:px-8">
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#111827] hover:bg-[#FFF4E5] transition"
          onClick={onMenuClick}
          aria-label="Open admin menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-base font-bold text-[#111827] lg:hidden">Admin</span>
      </div>
      <div className="flex items-center gap-3 text-[#111827]">
        <div className="flex flex-col items-end mr-1">
          <span className="text-xs font-semibold text-[#111827]">{adminId}</span>
          {adminSession?.sponsorId && (
            <span className="text-[10px] text-[#10B981] font-mono tracking-wider font-medium">{adminSession.sponsorId}</span>
          )}
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-[#F4B860] flex items-center justify-center bg-[#FFF4E5] text-[#111827] font-bold text-xs shadow-sm">
          {adminId.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
