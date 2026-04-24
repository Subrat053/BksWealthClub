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
      setError(err?.response?.data?.message || err.message || "Failed to send code");
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
      setMessage("Code verified. Now set the password and complete the account.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to verify code");
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
      setError(err?.response?.data?.message || err.message || "Failed to complete invite");
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
      setError(err?.response?.data?.message || err.message || "Failed to create user");
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
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-bold text-white">Invite + Verify</h2>
          <p className="mt-1 text-sm text-blue-100/75">Send a code to email, verify it, then set a password.</p>

          <div className="mt-5 space-y-4">
            <input name="sponsorId" value={form.sponsorId} onChange={handleChange} placeholder="Sponsor ID" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />

            <div className="flex gap-3">
              <button type="button" disabled={loading} onClick={handleRequestCode} className="flex-1 rounded-xl bg-[#1e327d] px-4 py-3 font-semibold text-white hover:bg-[#2944a8] disabled:opacity-60">Send Code</button>
            </div>

            <input name="code" value={form.code} onChange={handleChange} placeholder="Verification Code" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <button type="button" disabled={loading || !form.code} onClick={handleVerifyCode} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10 disabled:opacity-60">Verify Code</button>

            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <button type="button" disabled={loading || !inviteVerified} onClick={handleCompleteInvite} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">Complete User</button>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <h2 className="text-2xl font-bold text-white">Direct Create</h2>
          <p className="mt-1 text-sm text-blue-100/75">Admin creates the user immediately and sends a welcome email.</p>

          <div className="mt-5 space-y-4">
            <input name="sponsorId" value={form.sponsorId} onChange={handleChange} placeholder="Sponsor ID" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-[#08173f] px-4 py-3 text-white outline-none" />
            <button type="button" disabled={loading} onClick={handleDirectCreate} className="w-full rounded-xl bg-[#1e327d] px-4 py-3 font-semibold text-white hover:bg-[#2944a8] disabled:opacity-60">Create User</button>
          </div>
        </section>
      </div>
    </div>
  );
}
