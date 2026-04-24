import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5008/api/v1";

const normalizeApiBaseUrl = (url) => {
  if (!url) return "http://localhost:5008/api/v1";
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? `${trimmed}/v1` : trimmed;
};

const buildLoginUrls = (baseUrl) => {
  const normalizedBase = normalizeApiBaseUrl(baseUrl);
  const urls = [`${normalizedBase}/admin/login`];

  if (normalizedBase !== "http://localhost:5008/api/v1") {
    urls.push("http://localhost:5008/api/v1/admin/login");
  }

  return urls;
};

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError("Admin ID or email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const loginPayload = {
        identifier: formData.identifier.trim(),
        password: formData.password,
      };

      let data = null;
      let lastErrorMessage = "Invalid admin credentials.";
      const loginUrls = buildLoginUrls(API_BASE_URL);

      for (const loginUrl of loginUrls) {
        const res = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginPayload),
        });

        let responseData = null;
        try {
          responseData = await res.json();
        } catch {
          responseData = null;
        }

        if (res.ok && responseData?.success) {
          data = responseData;
          break;
        }

        if (responseData?.message) {
          lastErrorMessage = responseData.message;
        }

        if (responseData?.message !== "Route not found") {
          break;
        }
      }

      if (!data?.success) {
        throw new Error(lastErrorMessage);
      }

      const token = data.data?.token;
      const admin = data.data?.admin;

      if (!token) {
        throw new Error("Login failed. Token not received.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(admin));

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(100deg,#021139_0%,#052c55_55%,#0d476f_100%)] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#03071f] p-6 shadow-2xl">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-300">
          Login with your admin email or admin ID.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            className="h-11 w-full rounded-lg bg-[#2e3440] px-4 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
            placeholder="Admin ID or Email"
            autoComplete="username"
          />

          <div className="flex gap-2">
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              className="h-11 w-full rounded-lg bg-[#2e3440] px-4 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
              placeholder="Password"
              autoComplete="current-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-lg bg-white/10 px-3 text-sm hover:bg-white/15"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-linear-to-r from-[#3f63db] to-[#33c0d7] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
