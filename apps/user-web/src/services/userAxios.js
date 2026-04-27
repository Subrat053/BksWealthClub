import axios from "axios";

const userAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

userAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default userAxios;
