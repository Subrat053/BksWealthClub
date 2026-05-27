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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#111827]">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          {description}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <input
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="
              h-12
              w-full
              rounded-xl
              border
              border-[#E5E7EB]
              bg-white
              px-4
              text-center
              text-lg
              font-semibold
              tracking-[0.25em]
              text-[#111827]
              placeholder:text-[#9CA3AF]
              outline-none
              transition-all
              duration-300
              focus:border-[#F4B860]
              focus:ring-4
              focus:ring-[#F4B860]/20
            "
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}