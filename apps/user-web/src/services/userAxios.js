import axios from "axios";

let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

const ensureApiPrefix = (base) => {
  if (!base) return "";
  const prefix = "/api/v1";
  const normalized = base.replace(/\/+$/, "");
  return normalized.endsWith(prefix) ? normalized : `${normalized}${prefix}`;
};

API_BASE_URL = ensureApiPrefix(API_BASE_URL);

const userAxios = axios.create({
  baseURL: API_BASE_URL,
});

userAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default userAxios;
