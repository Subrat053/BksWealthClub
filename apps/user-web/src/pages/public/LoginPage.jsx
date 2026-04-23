import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await authService.login(form);

      // Save token
      localStorage.setItem("authToken", response.data.token);

      // Update auth context
      login({
        id: response.data.user._id,
        memberId: response.data.user.memberId,
        email: response.data.user.email,
        displayName: response.data.user.fullName,
        role: "member",
      });

      // Redirect to dashboard
      navigate("/member/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto lg:mx-auto max-w-2xl lg:m-12">
      <Card
        title="Member Login"
        className="overflow-hidden bg-[linear-gradient(160deg,#040a27_0%,#08133a_55%,#102567_100%)] p-0"
      >
        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Secure Access</p> */}
            <h2 className="mt-3 text-4xl font-bold text-white">Welcome Back</h2>
            <p className="mt-2 text-md text-slate-300">
              Login to access your member dashboard, team, incomes, and
              withdrawal controls.
            </p>
            {/* <div className="mt-6 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-xs text-cyan-100">
              Sponsor and autopool earnings are visible after account activation.
            </div> */}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField label="Email or BEP20 Address">
              <input
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none ring-0 focus:border-cyan-300/70"
              />
            </FormField>
            <FormField label="Password">
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
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
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {/* <div className="rounded-xl border border-slate-300/50 bg-white p-3 text-black">reCAPTCHA placeholder</div> */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-sm text-slate-300">
              Need an account?{" "}
              <Link to="/register" className="text-white underline">
                Register here
              </Link>
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}
