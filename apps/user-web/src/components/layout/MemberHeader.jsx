import { Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function MemberHeader({ onMenuClick }) {
  const { user } = useAuth();
  const memberId = user?.memberId || user?.username || "MEMBER";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 shadow-sm lg:px-8">
      <button
        className="text-[#111827] hover:bg-[#FFF4E5] p-2 rounded-lg transition lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="ml-auto flex items-center gap-3 text-[#111827]">
        <div className="h-9 w-9 rounded-full border-2 border-[#F4B860] bg-[#FFF4E5] flex items-center justify-center font-bold text-xs shadow-sm">
          {memberId.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Member</p>
          <span className="text-xs font-bold text-[#111827]">{memberId}</span>
        </div>
      </div>
    </header>
  );
}
