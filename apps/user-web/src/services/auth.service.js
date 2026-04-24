import { apiClient } from "./apiClient";

export const authService = {
  register: (payload) =>
    apiClient("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.name,
        email: payload.email,
        phone: payload.mobile,
        password: payload.password,
        sponsorId: payload.sponsor,
        registrationSource: "website",
      }),
    }),

  login: (payload) =>
    apiClient("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: payload.username,
        password: payload.password,
        captchaToken: payload.captchaToken,
      }),
    }),

  validateSponsor: (sponsorId) =>
    apiClient("/api/v1/referrals/validate-sponsor", {
      method: "POST",
      body: JSON.stringify({ sponsorId }),
    }),

  verifyEmail: (token) =>
    apiClient("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  getProfile: () => apiClient("/api/v1/auth/me"),
};
