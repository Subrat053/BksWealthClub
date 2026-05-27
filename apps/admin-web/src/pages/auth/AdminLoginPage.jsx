import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminLoginPage() {
  const { login } = useAuth();
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

      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
      });

      const responseData = await res.json();

      if (!res.ok || !responseData?.success) {
        throw new Error(responseData?.message || "Invalid admin credentials.");
      }

      const data = responseData;

      const token = data.data?.token;
      const admin = data.data?.admin;

      if (!token) {
        throw new Error("Login failed. Token not received.");
      }

      login(token, admin || {});

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-7 shadow-2xl">
        <div className="mb-6">
          <div className="mb-3 h-1.5 w-20 rounded-full bg-gradient-to-r from-[#F4B860] to-[#E8A13F]" />

          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Admin Login
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            Login with your admin email or admin ID.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            className="
              h-12
              w-full
              rounded-xl
              border
              border-[#E5E7EB]
              bg-white
              px-4
              text-[#111827]
              outline-none
              transition-all
              duration-300
              placeholder:text-[#9CA3AF]
              focus:border-[#F4B860]
              focus:ring-4
              focus:ring-[#F4B860]/20
            "
            placeholder="Admin ID or Email"
            autoComplete="username"
          />

          <div className="flex gap-2">
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              className="
                h-12
                w-full
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                text-[#111827]
                outline-none
                transition-all
                duration-300
                placeholder:text-[#9CA3AF]
                focus:border-[#F4B860]
                focus:ring-4
                focus:ring-[#F4B860]/20
              "
              placeholder="Password"
              autoComplete="current-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                text-sm
                font-semibold
                text-[#374151]
                transition-all
                duration-300
                hover:bg-[#FFF4E5]
                hover:text-[#111827]
              "
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              h-12
              w-full
              rounded-xl
              bg-[#F4B860]
              font-semibold
              text-[#111827]
              shadow-sm
              transition-all
              duration-300
              hover:bg-[#E8A13F]
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#F4B860]/20
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}