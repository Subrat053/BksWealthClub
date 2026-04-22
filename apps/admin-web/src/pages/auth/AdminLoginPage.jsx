import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement login logic here
    console.log("Login submitted");
    navigate("/admin/dashboard");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(100deg,#021139_0%,#052c55_55%,#0d476f_100%)] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#03071f] p-6">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <form className="mt-5 space-y-4">
          <input className="h-11 w-full rounded-lg bg-[#2e3440] px-4 outline-none" placeholder="Admin ID" />
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              className="h-11 w-full rounded-lg bg-[#2e3440] px-4 outline-none"
              placeholder="Password"
            />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="rounded-lg bg-white/10 px-3 text-sm">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="h-11 w-full rounded-lg bg-linear-to-r from-[#3f63db] to-[#33c0d7] font-semibold">Login</button>
        </form>
      </div>
    </div>
  );
}
