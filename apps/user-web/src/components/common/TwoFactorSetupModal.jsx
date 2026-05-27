import { useEffect, useState } from "react";
import Button from "./Button";

export default function TwoFactorSetupModal({
  open,
  qrCodeDataUrl,
  tempSecret,
  onVerify,
  onClose,
  loading = false,
}) {
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (open) {
      setOtp("");
    }
  }, [open]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    onVerify(otp);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-[#111827]">
          Enable Google Authenticator
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Scan this QR code using Google Authenticator, then enter the current
          6-digit code to activate 2FA.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Google Authenticator QR"
                className="mx-auto h-48 w-48"
              />
            ) : (
              <div className="grid h-48 w-48 place-items-center rounded-xl bg-[#F8FAFC] text-sm text-[#6B7280]">
                Loading QR...
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F4B860]/40 bg-[#FFF4E5] p-4 text-sm text-[#6B7280]">
              <span className="font-semibold text-[#111827]">
                Backup key:
              </span>

              <div className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-[13px] font-semibold text-[#111827]">
                {tempSecret || "Generating..."}
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit OTP"
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
                  {loading ? "Verifying..." : "Verify and Enable"}
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
      </div>
    </div>
  );
}