// ============================================
// 2. CREATE MODAL COMPONENT
// src/components/modals/CreateUserModal.jsx
// ============================================

import { useState } from "react";
// import { createUserByAdmin } from "../../api/adminUser.api";

import { createUserByAdmin } from "../../api/user.api";

export default function CreateUserModal({
  open,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    memberId: "",
    sponsorId: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await createUserByAdmin(form);

      setForm({
        memberId: "",
        sponsorId: "",
        fullName: "",
        email: "",
        password: "",
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#091a4a] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Create User
          </h2>

          <button
            onClick={onClose}
            className="text-white text-xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            name="memberId"
            placeholder="Member ID"
            value={form.memberId}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none"
          />

          <input
            name="sponsorId"
            placeholder="Sponsor ID"
            value={form.sponsorId}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none"
          />

          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none"
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1e327d] px-4 py-3 font-semibold text-white hover:bg-[#2944a8]"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}