import { useEffect, useState } from "react";
import Button from "./Button";

export default function TwoFactorOtpModal({
  open,
  title = "OTP Verification",
  description = "Enter your Google Authenticator 6-digit code to continue.",
  onSubmit,
  onClose,
  loading = false,
}) {
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (open) setOtp("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(otp);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#03081ccc] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[linear-gradient(170deg,rgba(5,18,58,0.98)_0%,rgba(12,33,94,0.98)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-cyan-100/80">{description}</p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="h-12 w-full rounded-xl border border-pink-400/35 bg-[#1d2b61] px-4 text-center text-lg tracking-[0.25em] text-white outline-none focus:border-cyan-300/70"
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button type="button" variant="muted" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
