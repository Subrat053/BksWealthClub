import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { authService } from "../../services/auth.service";
import { twoFactorService } from "../../services/twoFactor.service";
import { useAuth } from "../../hooks/useAuth";
import TwoFactorSetupModal from "../../components/common/TwoFactorSetupModal";
import TwoFactorOtpModal from "../../components/common/TwoFactorOtpModal";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    bepAddress: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [setupPayload, setSetupPayload] = useState({
    qrCodeDataUrl: "",
    tempSecret: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadProfile = async () => {
    setLoadingProfile(true);
    setStatusMessage("");

    try {
      const response = await authService.getProfile();
      const user = response?.data?.user || response?.data || {};

      setProfile({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        bepAddress: user.bepAddress || "",
      });
      setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
    } catch (error) {
      setStatusMessage(error.message || "Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleStartTwoFactorSetup = async () => {
    setSetupLoading(true);
    setStatusMessage("");

    try {
      const response = await twoFactorService.setup();
      setSetupPayload({
        qrCodeDataUrl: response?.data?.qrCodeDataUrl || "",
        tempSecret: response?.data?.tempSecret || "",
      });
      setShowSetupModal(true);
    } catch (error) {
      setStatusMessage(error.message || "Unable to start 2FA setup.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (otp) => {
    setVerifyLoading(true);
    setStatusMessage("");

    try {
      await twoFactorService.verify(otp);
      setShowSetupModal(false);
      setTwoFactorEnabled(true);
      setStatusMessage("2FA enabled successfully.");
      await loadProfile();
    } catch (error) {
      setStatusMessage(
        error.message || "Invalid OTP. Please try the latest code.",
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (twoFactorEnabled) {
      setShowOtpModal(true);
      return;
    }

    // send update immediately when 2FA not enabled
    doUpdateProfile();
  };

  const doUpdateProfile = async (otp) => {
    setUpdateLoading(true);
    setStatusMessage("");

    try {
      const payload = {
        name: profile.fullName,
        mobile: profile.phone,
        walletAddresses: profile.bepAddress
          ? [{ network: "BEP20", address: profile.bepAddress, isPrimary: true }]
          : undefined,
      };

      if (otp) payload.otp = otp;

      await authService.updateProfile(payload);

      // Refresh profile from server
      const refreshed = await authService.getProfile();
      const updatedUser = refreshed?.data?.user || refreshed?.data || {};

      // Update local state
      setProfile({
        fullName: updatedUser.fullName || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        bepAddress: updatedUser.bepAddress || "",
      });

      // Update auth context so changes appear everywhere
      if (user) {
        login({
          ...user,
          fullName: updatedUser.fullName || user.fullName,
          email: updatedUser.email || user.email,
          phone: updatedUser.phone || user.phone,
          bepAddress: updatedUser.bepAddress || user.bepAddress,
        });
      }

      setStatusMessage("✓ Profile updated successfully. Changes are now live.");
      setShowOtpModal(false);
    } catch (error) {
      setStatusMessage(error.message || "Failed to update profile.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="My Account"
        subtitle="Manage personal and wallet profile details"
      />
      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleProfileSubmit}
        >
          <FormField label="Full Name">
            <input
              value={profile.fullName}
              onChange={(e) =>
                setProfile((p) => ({ ...p, fullName: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <FormField label="Email">
            <input
              value={profile.email}
              readOnly
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <FormField label="Phone">
            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <FormField label="USDT Wallet">
            <input
              value={profile.bepAddress}
              onChange={(e) =>
                setProfile((p) => ({ ...p, bepAddress: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#2d3440] px-4 text-white outline-none focus:border-cyan-300/70"
            />
          </FormField>
          <div className="md:col-span-2 rounded-xl border p-4 text-sm">
            <div
              className={`${
                twoFactorEnabled
                  ? "border-emerald-300/25 bg-emerald-500/8 text-emerald-100"
                  : "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
              } rounded-xl border p-4`}
            >
              <p>
                Two-Factor Authentication:{" "}
                <span className="font-semibold">
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </p>

              {twoFactorEnabled ? (
                <p className="mt-2 text-md">2FA is enabled for your account.</p>
              ) : (
                <p className="mt-2 text-md">
                  Enhance your account security by enabling Two-Factor
                  Authentication using Google Authenticator.
                </p>
              )}

              {!twoFactorEnabled && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleStartTwoFactorSetup}
                    disabled={setupLoading || loadingProfile}
                  >
                    {setupLoading ? "Preparing..." : "Enable 2FA"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loadingProfile || updateLoading}>
              {updateLoading
                ? "Updating..."
                : loadingProfile
                  ? "Loading profile..."
                  : "Update Profile"}
            </Button>
          </div>
          {statusMessage && (
            <div
              className={`md:col-span-2 rounded-lg p-3 text-sm font-medium ${
                statusMessage.includes("✓")
                  ? "border border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                  : "border border-red-300/30 bg-red-500/15 text-red-100"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </form>
      </Card>

      <TwoFactorSetupModal
        open={showSetupModal}
        qrCodeDataUrl={setupPayload.qrCodeDataUrl}
        tempSecret={setupPayload.tempSecret}
        loading={verifyLoading}
        onVerify={handleVerifyTwoFactor}
        onClose={() => setShowSetupModal(false)}
      />

      <TwoFactorOtpModal
        open={showOtpModal}
        title="Confirm profile update"
        description="Enter your Google Authenticator code to confirm profile changes."
        loading={updateLoading}
        onClose={() => setShowOtpModal(false)}
        onSubmit={(otp) => doUpdateProfile(otp)}
      />
    </div>
  );
}
