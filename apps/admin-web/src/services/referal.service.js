import axiosInstance from "../utils/axiosInstance";

export async function adminApiClient(url, options = {}) {
  const response = await axiosInstance({
    url,
    ...options,
  });
  return response.data;
}

export const referralService = {
  getAdminReferralTree: () => {
    return adminApiClient("/referrals/admin/tree");
  },
};
