import { Menu } from "lucide-react";

export default function AdminHeader({ adminSession, onMenuClick }) {
  const adminId = adminSession?.adminId || adminSession?.displayName || "ADMIN";

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#071436]/75 px-4 backdrop-blur lg:px-8">
      <button className="text-white lg:hidden" onClick={onMenuClick} aria-label="Open admin menu">
        <Menu size={22} />
      </button>
      <div className="ml-auto flex items-center gap-3 text-white">
        <div className="h-9 w-9 rounded-full bg-white/20" />
        <span className="text-sm font-semibold">{adminId}</span>
      </div>
    </header>
  );
}
