import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    sponsor: "",
    name: "",
    email: "",
    country: "India",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const sponsorStatus = useMemo(
    () => (form.sponsor === "GRW328370" ? "Sponsor not Active" : "Sponsor Active"),
    [form.sponsor],
  );

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }
    setError("");
  };

  return (
    <div className="mx-auto max-w-3xl my-6">
      <Card title="Register" className="bg-[linear-gradient(160deg,#040a27_0%,#08133a_55%,#102567_100%)]">
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Sponsor">
            <input
              value={form.sponsor}
              onChange={(e) => setForm((prev) => ({ ...prev, sponsor: e.target.value }))}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
            />
            {/* <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                sponsorStatus.includes("not") ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
              }`}
            >
              {sponsorStatus}
            </p> */}
          </FormField>
          <FormField label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Country">
              <select
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              >
                <option>India</option>
                <option>Afghanistan</option>
                <option>Bangladesh</option>
              </select>
            </FormField>
            <FormField label="Mobile">
              <input
                value={form.mobile}
                onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              />
            </FormField>
          </div>

          <FormField label="Password">
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm Password">
            <div className="flex gap-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </FormField>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" className="w-full">
            Register
          </Button>
          <p className="text-sm text-slate-300">
            Already have an account? <Link to="/login" className="text-white underline">Login</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
