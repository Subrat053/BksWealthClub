import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../../services/auth.service";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { countries } from "../../utils/countries";

export default function RegisterPage() {
  const sponsorIdPattern = /^(BKS|BWC)\d{5,}$/i;
  const referralCodePattern = /^[A-Z]{1,4}\d{6}$/i;
  const sponsorPattern = (value) =>
    sponsorIdPattern.test(value) || referralCodePattern.test(value);
  const registerModalLogo = `${import.meta.env.BASE_URL}logo.png`;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  const defaultCountry = countries.find((item) => item.code === "IN");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [registeredMemberId, setRegisteredMemberId] = useState("");

  const [form, setForm] = useState({
    sponsor: "",
    name: "",
    email: "",
    country: defaultCountry.name,
    countryCode: defaultCountry.code,
    dialCode: defaultCountry.dialCode,
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sponsorValidation, setSponsorValidation] = useState(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);

  useEffect(() => {
    if (referralCode) {
      setForm((prev) => ({
        ...prev,
        sponsor: referralCode.toUpperCase(),
      }));
    }
  }, [referralCode]);

  const sponsorStatus = useMemo(() => {
    if (!form.sponsor) return null;
    if (!sponsorPattern(form.sponsor))
      return "Enter sponsor ID or referral code like BKS12345 or ABCD123456";
    if (sponsorLoading) return "Checking...";
    if (sponsorValidation?.error) return sponsorValidation.error;
    if (!sponsorValidation?.data) return null;
    return sponsorValidation.data.active
      ? `Sponsor: ${sponsorValidation.data.sponsorName}`
      : "Sponsor not Active";
  }, [form.sponsor, sponsorValidation, sponsorLoading]);

  useEffect(() => {
    const sponsorId = form.sponsor.trim().toUpperCase();

    if (!sponsorId || !sponsorPattern(sponsorId)) {
      setSponsorLoading(false);
      setSponsorValidation(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSponsorLoading(true);
      try {
        const result = await authService.validateSponsor(sponsorId);
        setSponsorValidation(result);
      } catch {
        setSponsorValidation({
          error: "Sponsor not found.",
        });
      } finally {
        setSponsorLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [form.sponsor]);

  const onSponsorChange = (e) => {
    setForm((prev) => ({
      ...prev,
      sponsor: e.target.value.toUpperCase(),
    }));
  };

  const onCountryChange = (e) => {
    const selected = countries.find((item) => item.code === e.target.value);

    setForm((prev) => ({
      ...prev,
      country: selected.name,
      countryCode: selected.code,
      dialCode: selected.dialCode,
    }));
  };

  const onMobileChange = (e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      mobile: onlyNumbers,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.sponsor ||
      !form.mobile
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (!sponsorPattern(form.sponsor.trim())) {
      setError(
        "Sponsor ID or referral code must look like BKS12345 or ABCD123456.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (sponsorValidation?.error || !sponsorValidation?.data?.active) {
      setError("Please provide a valid and active sponsor ID.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const fullMobileNumber = `${form.dialCode}${form.mobile}`;

      const response = await authService.register({
        sponsor: form.sponsor.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        country: form.country,
        countryCode: form.countryCode,
        dialCode: form.dialCode,
        mobile: fullMobileNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      const newMemberId =
        response?.data?.memberId || response?.memberId || "BKS000000";

      setSuccess("Registration successful.");
      setRegisteredMemberId(newMemberId);
      setShowWelcomeModal(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-6 max-w-3xl">
      <Card
        title="Register"
        className="border border-slate-200 bg-white shadow-xl"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Sponsor ID">
            <input
              value={form.sponsor}
              onChange={onSponsorChange}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              placeholder="Enter sponsor ID"
            />

            {sponsorStatus && (
              <p
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  sponsorStatus === "Sponsor not Active" ||
                  sponsorStatus ===
                    "Enter sponsor ID or referral code like BKS12345 or ABCD123456" ||
                  sponsorValidation?.error
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {sponsorStatus}
              </p>
            )}
          </FormField>

          <FormField label="Name">
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              placeholder="Enter your name"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              placeholder="Enter your email"
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Country">
              <select
                value={form.countryCode}
                onChange={onCountryChange}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Mobile">
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[#E8A13F] focus-within:ring-2 focus-within:ring-[#E8A13F]/20">
                <span className="flex h-12 items-center border-r border-slate-200 px-4 text-sm font-semibold text-[#E8A13F] bg-[#FFF4E5]">
                  {form.dialCode}
                </span>

                <input
                  value={form.mobile}
                  onChange={onMobileChange}
                  className="h-12 w-full bg-transparent px-4 text-slate-900 outline-none"
                  placeholder="Mobile number"
                  inputMode="numeric"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Password">
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm Password">
            <div className="flex gap-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </FormField>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>

          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#E8A13F] hover:underline">
              Login
            </Link>
          </p>
        </form>
      </Card>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl text-left m-auto"
            >
              <div className="mb-6 text-center">
                <img
                  src={registerModalLogo}
                  alt="BKS Wealth Club Logo"
                  className="mx-auto h-32 w-auto object-contain drop-shadow-md"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              <div className="space-y-4 text-slate-600 text-[15px] leading-relaxed">
                <p>
                  Dear{" "}
                  <strong className="text-slate-900 text-base capitalize">
                    {form.name}
                  </strong>
                  ,
                </p>

                <p className="text-lg font-bold text-[#E8A13F]">
                  Welcome to BKS Wealth Club Family
                </p>

                <div className="rounded-xl bg-[#FFF4E5] border border-[#F4B860]/30 p-5 space-y-3">
                  <p>
                    Your Id is{" "}
                    <strong className="text-[#E8A13F] font-mono text-base">
                      {registeredMemberId}
                    </strong>
                  </p>
                  <p>
                    Your password is{" "}
                    <strong className="text-emerald-600 font-mono text-base">
                      {form.password}
                    </strong>
                  </p>
                  <p>
                    Your registration date and time :{" "}
                    <strong className="text-slate-900">
                      {new Date().toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </p>
                </div>

                <div className="pt-2">
                  <h3 className="text-slate-900 font-semibold text-base mb-3 border-b border-slate-200 pb-2 uppercase tracking-wide">
                    Next steps
                  </h3>
                  <ul className="space-y-2 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">1)</span>
                      <span>
                        Check your email we have sent a verification link.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">2)</span>
                      <span>
                        Secure your account with 2FA (google authenticator).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">3)</span>
                      <span>Activate your id and enjoy your earnings.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">4)</span>
                      <span>Refer other members and build your community.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-2">
                  <p>
                    For support email to{" "}
                    <a
                      href="mailto:support@bkswealth.club"
                      className="text-amber-400 hover:underline"
                    >
                      support@bkswealth.club
                    </a>
                  </p>
                  <p>Or use the support form in your member login.</p>
                </div>

                <div className="pt-4">
                  <p>Best Regards,</p>
                  <p className="font-semibold text-[#E8A13F] tracking-wide mt-1">
                    Team BKS Wealth Club
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate("/login", {
                    state: { registeredEmail: form.email.trim() },
                  })
                }
                className="mt-8 w-full rounded-xl bg-[#111827] py-3.5 font-bold text-white shadow-sm transition hover:bg-[#1F2937] active:scale-[0.98]"
              >
                Continue to Login
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
