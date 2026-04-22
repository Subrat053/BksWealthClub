import { apiClient } from "./apiClient";

export const authService = {
  login: (payload) => apiClient(() => ({ ok: true, user: { username: payload.username } })),
  register: (payload) => apiClient(() => ({ ok: true, userId: "u_001", payload })),
  validateSponsor: (sponsorId) =>
    apiClient(() => ({ ok: true, sponsorId, status: sponsorId === "GRW328370" ? "inactive" : "active" })),
};
