import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Card from "../../components/common/Card";
import { authService } from "../../services/auth.service";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus("success");
        setMessage(
          "Your email has been verified successfully. You can now log in.",
        );
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="mx-auto my-10 max-w-xl px-4">
      <Card
        title="Verify Email"
        className="bg-[linear-gradient(160deg,#040a27_0%,#08133a_55%,#102567_100%)]"
      >
        <p
          className={`text-sm ${status === "success" ? "text-emerald-300" : status === "error" ? "text-red-300" : "text-slate-300"}`}
        >
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-linear-to-r from-[#3f63db] via-[#3e7cec] to-[#33c0d7] px-5 text-sm font-semibold text-white"
          >
            Go to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
