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

  const statusStyles = {
    loading: "bg-[#FFF4E5] text-[#E8A13F] border-[#F4B860]/40",
    success: "bg-green-50 text-[#10B981] border-green-200",
    error: "bg-red-50 text-[#EF4444] border-red-200",
  };

  return (
    <div className="mx-auto my-10 max-w-xl px-4">
      <Card
        title="Verify Email"
        className="border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div
          className={`
            rounded-2xl
            border
            p-5
            text-sm
            font-medium
            leading-relaxed
            ${statusStyles[status]}
          `}
        >
          {message}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/login"
            className="
              inline-flex
              h-12
              items-center
              justify-center
              rounded-xl
              bg-[#F4B860]
              px-5
              text-sm
              font-semibold
              text-[#111827]
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-[#E8A13F]
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#F4B860]/20
            "
          >
            Go to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}