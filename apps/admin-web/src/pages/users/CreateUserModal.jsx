import { useState } from "react";
import { createUserByAdmin } from "../../api/user.api";
import SuccessModal from "../../components/common/SuccessModal";

export default function CreateUserModal({ open, onClose, onSuccess }) {
    const [form, setForm] = useState({
        sponsorId: "",
        fullName: "",
        phone: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    if (!open && !showSuccess) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            await createUserByAdmin(form);
            setForm({ sponsorId: "", fullName: "", phone: "", email: "", password: "" });
            onSuccess();
            setShowSuccess(true);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        onClose(); // 👈 close the whole flow after success dismiss
    };

    // 👇 Show success modal after creation
    if (showSuccess) {
        return (
            <SuccessModal
                open={showSuccess}
                onClose={handleSuccessClose}
                title="User Created!"
                message={`The account for ${form.fullName || "the user"} has been created successfully.`}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create User</h2>
                    <button onClick={onClose} className="text-xl text-slate-400 hover:text-slate-600 transition">✕</button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 font-semibold shadow-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* memberId removed — auto-generated on the server */}

                    <input
                        name="sponsorId"
                        placeholder="Sponsor ID"
                        value={form.sponsorId}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
                    />

                    <input
                        name="fullName"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
                    />

                    <input
                        name="phone"
                        type="tel"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
                    />


                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 transition shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-[#111827] px-4 py-3 font-bold text-white hover:bg-[#1F2937] transition shadow-md shadow-slate-100"
                        >
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}