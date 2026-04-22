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
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#03071f]/88 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200">Autopool Network</p>
                    <Link to="/" className="text-2xl font-bold text-white">
                        BksWealthClub
                    </Link>
                </div>
                <nav className="hidden items-center gap-6 lg:flex">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `rounded-md px-3 py-2 text-sm ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="hidden items-center gap-2 md:flex">
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-cyan-400 hover:text-slate-950"
                    >
                        Login
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 transition group-hover:bg-slate-900 group-hover:text-white">
                            <ChevronRight size={14} />
                        </span>
                    </Link>
                    <Link
                        to="/register"
                        className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-105"
                    >
                        Register
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900">
                            <ChevronRight size={14} />
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
