import axiosInstance from "../utils/axiosInstance";

// GET USERS
export const fetchUsers = (params) => {
  return axiosInstance.get("/admin/users", { params });
};

// DELETE USER
export const deleteUser = (userId) => {
  return axiosInstance.delete(`/admin/users/${userId}`);
};

// UPDATE STATUS
export const updateUserStatus = (userId, status) => {
  return axiosInstance.patch(`/admin/users/${userId}/status`, { status });
};

// GET SINGLE USER
export const getUserDetails = (userId) => {
  return axiosInstance.get(`/admin/users/${userId}`);
};

export const createUserByAdmin = async (payload) => {
  const res = await axiosInstance.post("/admin/create-user", payload);
  return res.data;
};

export const requestUserInviteCode = async (payload) => {
  const res = await axiosInstance.post(
    "/admin/users/invite/request-code",
    payload,
  );
  return res.data;
};

export const verifyUserInviteCode = async (payload) => {
  const res = await axiosInstance.post(
    "/admin/users/invite/verify-code",
    payload,
  );
  return res.data;
};

export const completeUserInvite = async (payload) => {
  const res = await axiosInstance.post("/admin/users/invite/complete", payload);
  return res.data;
};
