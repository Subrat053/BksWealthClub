import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { countries } from "../../utils/countries";

export default function RegisterPage() {
  const sponsorPattern = /^BWC\d{6,}$/;
  const navigate = useNavigate();
  const { login } = useAuth();

  const defaultCountry = countries.find((item) => item.code === "IN");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
  const [sponsorValidation, setSponsorValidation] = useState(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);

  const sponsorStatus = useMemo(() => {
    if (!form.sponsor) return null;
    if (!sponsorPattern.test(form.sponsor))
      return "Enter sponsor ID like BWC123456";
    if (sponsorLoading) return "Checking...";
    if (sponsorValidation?.error) return sponsorValidation.error;
    if (!sponsorValidation?.data) return null;
    return sponsorValidation.data.active
      ? "Sponsor Active"
      : "Sponsor not Active";
  }, [form.sponsor, sponsorValidation, sponsorLoading]);

  useEffect(() => {
    const sponsorId = form.sponsor.trim().toUpperCase();

    if (!sponsorId || !sponsorPattern.test(sponsorId)) {
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

    if (!sponsorPattern.test(form.sponsor.trim().toUpperCase())) {
      setError("Sponsor ID must be like BWC123456.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const fullMobileNumber = `${form.dialCode}${form.mobile}`;

      await authService.register({
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

      const loginResponse = await authService.login({
        username: form.email,
        password: form.password,
      });

      localStorage.setItem("authToken", loginResponse.data.token);

      login({
        id: loginResponse.data.user._id,
        memberId: loginResponse.data.user.memberId,
        email: loginResponse.data.user.email,
        displayName: loginResponse.data.user.fullName,
        role: "member",
      });

      navigate("/member/dashboard");
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
        className="bg-[linear-gradient(160deg,#040a27_0%,#08133a_55%,#102567_100%)]"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Sponsor ID">
            <input
              value={form.sponsor}
              onChange={onSponsorChange}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Enter sponsor ID"
            />

            {sponsorStatus && (
              <p
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  sponsorStatus === "Sponsor not Active" ||
                  sponsorStatus === "Enter sponsor ID like BWC123456" ||
                  sponsorValidation?.error
                    ? "bg-red-500/20 text-red-300"
                    : "bg-green-500/20 text-green-300"
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
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
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
              className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              placeholder="Enter your email"
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Country">
              <select
                value={form.countryCode}
                onChange={onCountryChange}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Mobile">
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#1f2c59] focus-within:border-cyan-300/70">
                <span className="flex h-12 items-center border-r border-white/10 px-4 text-sm font-semibold text-cyan-200">
                  {form.dialCode}
                </span>

                <input
                  value={form.mobile}
                  onChange={onMobileChange}
                  className="h-12 w-full bg-transparent px-4 text-white outline-none"
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
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
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
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1f2c59] px-4 text-white outline-none focus:border-cyan-300/70"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </FormField>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>

          <p className="text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="text-white underline">
              Login
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
