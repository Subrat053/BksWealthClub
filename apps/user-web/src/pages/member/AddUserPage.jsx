import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";

export default function AddUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sponsorId = user?.memberId || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authService.memberRegister({
        ...form,
        sponsorId,
      });

      setSuccess("User added successfully. Verification email has been sent.");
      setForm({ name: "", email: "", mobile: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-6 max-w-3xl">
      <Card title="Add User" className="bg-[linear-gradient(160deg,#040a27_0%,#08133a_55%,#102567_100%)]">
        <p className="mb-4 text-sm text-slate-300">
          This user will be created under your sponsor ID <span className="font-semibold text-white">{sponsorId || "-"}</span> and will receive a verification link by email.
        </p>

        {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mb-4 text-sm text-emerald-300">{success}</p> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Full Name">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Enter full name"
            />
          </FormField>

          <FormField label="Email">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Enter email"
            />
          </FormField>

          <FormField label="Mobile">
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Enter mobile number"
            />
          </FormField>

          <FormField label="Password">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Create password"
            />
          </FormField>

          <FormField label="Confirm Password">
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Confirm password"
            />
          </FormField>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Adding..." : "Add User"}
            </Button>
            <Button type="button" variant="muted" onClick={() => navigate("/member/dashboard")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
