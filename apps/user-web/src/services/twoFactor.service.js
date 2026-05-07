import { apiClient } from "./apiClient";

export const twoFactorService = {
  setup: () =>
    apiClient("/2fa/setup", {
      method: "POST",
    }),

  verify: (otp) =>
    apiClient("/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ otp }),
    }),

  validate: (otp) =>
    apiClient("/2fa/validate", {
      method: "POST",
      body: JSON.stringify({ otp }),
    }),
};
