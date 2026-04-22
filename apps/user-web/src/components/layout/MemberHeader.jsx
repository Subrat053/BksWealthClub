import { Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function MemberHeader({ onMenuClick }) {
  const { user } = useAuth();
  const memberId = user?.memberId || user?.username || "MEMBER";

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#071436]/75 px-4 backdrop-blur lg:px-8">
      <button className="text-white/80 lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <div className="ml-auto flex items-center gap-3 text-white">
        <div className="h-10 w-10 rounded-full border border-cyan-300/40 bg-gradient-to-br from-cyan-400/30 to-blue-500/20" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Member</p>
          <span className="text-sm font-semibold lg:text-base">{memberId}</span>
        </div>
      </div>
    </header>
  );
}
