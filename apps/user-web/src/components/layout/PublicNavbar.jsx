import { Link, NavLink } from "react-router-dom";
import Button from "../common/Button";
import { ChevronRight } from "lucide-react";
const links = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Projects", to: "/projects" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
];

export default function PublicNavbar() {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#E8A13F] font-bold">Autopool Network</p>
                    <Link to="/" className="text-2xl font-extrabold text-slate-855">
                        BksWealthClub
                    </Link>
                </div>
                <nav className="hidden items-center gap-6 lg:flex">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-[#FFF4E5] text-[#E8A13F] border border-[#F4B860]/30 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-850"}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="hidden items-center gap-2 md:flex">
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
                    >
                        Login
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                            <ChevronRight size={14} />
                        </span>
                    </Link>
                    <Link
                        to="/register"
                        className="group inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1F2937] active:scale-[0.98]"
                    >
                        Register
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:bg-white/30">
                            <ChevronRight size={14} />
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
