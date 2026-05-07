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
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#03081ccc] p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-cyan-200/20 bg-[linear-gradient(170deg,rgba(5,18,58,0.98)_0%,rgba(12,33,94,0.98)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <h2 className="text-2xl font-bold text-white">
          Enable Google Authenticator
        </h2>
        <p className="mt-1 text-sm text-cyan-100/80">
          Scan this QR code using Google Authenticator, then enter the current
          6-digit code to activate 2FA.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-2xl border border-cyan-100/20 bg-white p-3">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Google Authenticator QR"
                className="mx-auto h-48 w-48"
              />
            ) : (
              <div className="grid h-48 w-48 place-items-center bg-slate-100 text-sm text-slate-500">
                Loading QR...
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-yellow-300/35 bg-yellow-300/10 p-3 text-sm text-yellow-100">
              Backup key:
              <div className="mt-1 break-all font-mono text-[13px] text-yellow-50">
                {tempSecret || "Generating..."}
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit OTP"
                className="h-12 w-full rounded-xl border border-white/20 bg-[#1d2b61] px-4 text-center text-lg tracking-[0.25em] text-white outline-none focus:border-cyan-300/70"
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify and Enable"}
                </Button>
                <Button type="button" variant="muted" onClick={onClose}>
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
