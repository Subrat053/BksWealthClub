import { apiClient } from "./apiClient";

export const authService = {
  register: (payload) =>
    apiClient("/auth/register", {
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

  memberRegister: (payload) =>
    apiClient("/auth/member-register", {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.name,
        email: payload.email,
        phone: payload.mobile,
        password: payload.password,
        sponsorId: payload.sponsorId,
        registrationSource: "member_panel",
      }),
    }),

  login: (payload) =>
    apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: payload.username,
        password: payload.password,
        captchaToken: payload.captchaToken,
      }),
    }),

  validateSponsor: (sponsorId) =>
    apiClient("/referrals/validate-sponsor", {
      method: "POST",
      body: JSON.stringify({ sponsorId }),
    }),

  verifyEmail: (token) =>
    apiClient("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  getProfile: () => apiClient("/auth/me"),
  updateProfile: (payload) =>
    apiClient("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
