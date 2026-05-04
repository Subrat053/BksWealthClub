import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import { authService } from "../../services/auth.service";
import { twoFactorService } from "../../services/twoFactor.service";
import { withdrawalService } from "../../services/withdrawal.service";
import TwoFactorOtpModal from "../../components/common/TwoFactorOtpModal";

export default function MakeWithdrawalPage() {
  const [form, setForm] = useState({ amount: "", walletAddress: "" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authService.getProfile();
        const user = response?.data?.user || response?.data || {};
        setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
      } catch (error) {
        setStatus(error.message || "Unable to load 2FA status.");
      }
    };

    loadProfile();
  }, []);

  const submitWithdrawal = async (otpCode = null) => {
    setLoading(true);
    setStatus("");

    try {
      const payload = {
        amount: Number(form.amount),
        walletAddress: form.walletAddress.trim(),
      };

      if (otpCode) {
        payload.twoFactorCode = otpCode;
      }

      await withdrawalService.requestWithdrawal(payload);
      setStatus("Withdrawal request submitted successfully.");
      setForm({ amount: "", walletAddress: "" });
      setShowOtpModal(false);
    } catch (error) {
      setStatus(error.message || "Failed to submit withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.walletAddress.trim()
    ) {
      setStatus("Amount and wallet address are required.");
      return;
    }

    if (twoFactorEnabled) {
      setShowOtpModal(true);
      return;
    }

    await submitWithdrawal();
  };

  const handleOtpConfirm = async (otp) => {
    setLoading(true);
    setStatus("");

    try {
      await twoFactorService.validate(otp);
      await submitWithdrawal(otp);
    } catch (error) {
      setStatus(error.message || "OTP validation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Make Withdrawal"
        subtitle="Request payout with 2FA verification and wallet security"
      />
      <Card title="Withdrawal Form">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormField label="Amount (USD)">
            <input
              value={form.amount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Minimum 10"
              type="number"
              min="10"
            />
          </FormField>
          <FormField label="Wallet Address">
            <input
              value={form.walletAddress}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  walletAddress: event.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="USDT wallet"
            />
          </FormField>
          <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#1a2755] p-4 text-sm text-slate-200">
            {twoFactorEnabled
              ? "2FA is enabled. OTP verification is required before this withdrawal is submitted."
              : "2FA is not enabled. You can enable it from Edit Profile for extra security."}
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
              variant="danger"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Withdrawal"}
            </Button>
          </div>
          {status ? (
            <p className="md:col-span-2 text-sm text-cyan-100">{status}</p>
          ) : null}
        </form>
      </Card>

      <TwoFactorOtpModal
        open={showOtpModal}
        title="Withdrawal Verification"
        description="Enter your current Google Authenticator code to authorize this withdrawal."
        loading={loading}
        onClose={() => {
          if (!loading) setShowOtpModal(false);
        }}
        onSubmit={handleOtpConfirm}
      />
    </div>
  );
}
