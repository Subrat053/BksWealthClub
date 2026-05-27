import { useState } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import {
  completeUserInvite,
  createUserByAdmin,
  requestUserInviteCode,
  verifyUserInviteCode,
} from "../../api/user.api";

const emptyForm = {
  sponsorId: "",
  fullName: "",
  phone: "",
  email: "",
  password: "",
  code: "",
};

export default function AddUserPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inviteVerified, setInviteVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setMessage("");
  };

  const reset = () => {
    setForm(emptyForm);
    setInviteVerified(false);
  };

  const handleRequestCode = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await requestUserInviteCode({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        sponsorId: form.sponsorId,
      });

      setMessage("Verification code sent to the provided email.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to send code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await verifyUserInviteCode({
        email: form.email,
        code: form.code,
      });

      setInviteVerified(true);
      setMessage(
        "Code verified. Now set the password and complete the account.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to verify code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInvite = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await completeUserInvite({
        email: form.email,
        password: form.password,
      });

      setMessage("User created successfully and welcome email sent.");
      reset();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to complete invite",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCreate = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await createUserByAdmin({
        sponsorId: form.sponsorId,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      setMessage("User created successfully and welcome email sent.");
      reset();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add User"
        subtitle="Create a user directly with welcome mail, or send a verification code first and complete the account after code confirmation."
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invite + Verify</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Send a code to email, verify it, then set a password.
          </p>

          <div className="mt-5 space-y-4">
            <input
              name="sponsorId"
              value={form.sponsorId}
              onChange={handleChange}
              placeholder="Sponsor ID"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />

            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleRequestCode}
                className="flex-1 rounded-xl bg-[#111827] px-4 py-3 font-bold text-white hover:bg-[#1F2937] disabled:opacity-60 transition shadow-sm"
              >
                Send Code
              </button>
            </div>

            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Verification Code"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <button
              type="button"
              disabled={loading || !form.code}
              onClick={handleVerifyCode}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition shadow-sm"
            >
              Verify Code
            </button>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <button
              type="button"
              disabled={loading || !inviteVerified}
              onClick={handleCompleteInvite}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-md shadow-emerald-100"
            >
              Complete User
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Direct Create</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Admin creates the user immediately and sends a welcome email.
          </p>

          <div className="mt-5 space-y-4">
            <input
              name="sponsorId"
              value={form.sponsorId}
              onChange={handleChange}
              placeholder="Sponsor ID"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/20 focus:bg-white transition shadow-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={handleDirectCreate}
              className="w-full rounded-xl bg-[#111827] px-4 py-3 font-bold text-white hover:bg-[#1F2937] disabled:opacity-60 transition shadow-md shadow-slate-100"
            >
              Create User
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
