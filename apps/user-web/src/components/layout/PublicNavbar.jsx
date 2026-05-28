import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "../common/Button";
import { ChevronRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Projects", to: "/projects" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
];

export default function PublicNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
                <Link to="/" className="flex items-center">
                    {/* <div className="flex items-center"> */}
                        <div className="w-18 lg:w-20">
                            <img src="/bks_logo.png" alt="logo" className="scale-125" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-[#E8A13F] font-bold">Autopool Network</p>
                            <span className="text-2xl font-extrabold text-slate-855">
                                BksWealthClub
                            </span>
                        </div>
                    {/* </div> */}
                </Link>
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

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8A13F]/20 active:scale-95 lg:hidden"
                    aria-expanded={isOpen}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown using Framer Motion */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute top-full left-0 right-0 overflow-hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg lg:hidden"
                    >
                        <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
                            <nav className="flex flex-col gap-1.5">
                                {links.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={closeMenu}
                                        className={({ isActive }) =>
                                            `rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                                                isActive
                                                    ? "bg-[#FFF4E5] text-[#E8A13F] font-bold border-l-4 border-[#E8A13F]"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                            </nav>
                            
                            {/* Action buttons (only show on mobile under md) */}
                            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 md:hidden">
                                <Link
                                    to="/login"
                                    onClick={closeMenu}
                                    className="group flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
                                >
                                    Login
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                                        <ChevronRight size={12} />
                                    </span>
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={closeMenu}
                                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#111827] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1F2937]"
                                >
                                    Register
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:bg-white/30">
                                        <ChevronRight size={12} />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
