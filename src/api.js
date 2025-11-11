import axios from "axios";
import { getToken } from "@/utils/auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://backend-dorsa.onrender.com";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = error;
    if (error.response?.data) {
      normalizedError.message =
        error.response.data.message ||
        error.response.data.error ||
        error.message;
      normalizedError.data = error.response.data;
      normalizedError.status = error.response.status;
    }
    return Promise.reject(normalizedError);
  }
);

const buildImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:/i.test(value)) return value;

  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalized}`;
};

export const predictMeal = async (file, { capturedAt } = {}) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("image", file);
  if (capturedAt) {
    formData.append("meal_date", capturedAt);
  }

  const { data } = await apiClient.post("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

export const fetchMealHistory = async () => {
  const { data } = await apiClient.get("/history");
  return Array.isArray(data?.items) ? data.items : [];
};

export const login = async (credentials) => {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
};

export const signUp = async (payload) => {
  const { data } = await apiClient.post("/auth/signup", payload);
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get("/auth/me");
  return data?.user || null;
};

export const performHealthCheck = async () => {
  const { data } = await apiClient.get("/health");
  return data;
};

export const resolveBackendImage = (value) => {
  const url = buildImageUrl(value);
  return url || "/img/home-decor-1.jpeg";
};

export default {
  API_BASE_URL,
  apiClient,
  predictMeal,
  fetchMealHistory,
  login,
  signUp,
  fetchCurrentUser,
  performHealthCheck,
  resolveBackendImage,
};
