import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Centralized Axios instance.
 * - Attaches JWT access token to every request automatically
 * - On 401 (expired token), tries silent refresh ONCE, then retries the original request
 * - If refresh also fails -> forces logout (redirect to /login)
 *
 * This is the ONLY place that knows about tokens - services/*.ts never touch localStorage directly.
 */

const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:5000/api/v1"
  : "https://scholarship-crm.onrender.com/api/v1";

const apiBaseURL = import.meta.env.VITE_API_URL || defaultApiUrl;

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// --- Request interceptor: attach access token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: handle 401 with a single silent refresh attempt ---
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function processQueue(error: Error | null, token: string | null = null) {
  pendingQueue.forEach((prom) => {
    if (error) {
      // we don't use error in our current queue signature, but keeping for clarity
      prom(error as any);
    } else {
      prom(token!);
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const requestUrl = originalRequest?.url ?? "";
    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/verify-otp") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/refresh-token");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Agar refresh already chal raha hai, is request ko queue me daal do
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${apiBaseURL}/auth/refresh-token`, {
          refreshToken,
        });

        // FIX: API response envelope ke andar accessToken hota hai, root par nahi.
        const newAccessToken = data.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;