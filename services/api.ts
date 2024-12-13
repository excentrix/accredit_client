// api.ts
import axios from "axios";
import { STORAGE_KEYS } from "@/context/settings-context";
import { needsSettings } from "./api-wrapper";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for handling cookies
});

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  return Cookies.get(name) || null;
};

// Helper function to get parsed cookie value
const getParsedCookie = (name: string): number | undefined => {
  const value = Cookies.get(name);
  return value ? parseInt(value, 10) : undefined;
};

api.interceptors.request.use(
  (config) => {
    // Add auth token from cookie
    const token = getCookie("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add settings params if needed
    if (needsSettings(config.url || "")) {
      const boardId = localStorage.getItem(STORAGE_KEYS.SELECTED_BOARD);
      const academicYearId = localStorage.getItem(
        STORAGE_KEYS.SELECTED_ACADEMIC_YEAR
      );

      config.params = {
        ...config.params,
        board: boardId ? parseInt(boardId, 10) : undefined,
        academic_year: academicYearId
          ? parseInt(academicYearId, 10)
          : undefined,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from cookie
        const refreshToken = getCookie("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/user/token/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true }
        );

        if (response.data.access) {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear cookies on refresh failure
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });

        // Redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Add methods to handle cookies
export const cookieUtils = {
  setAuthCookies: (accessToken: string, refreshToken: string) => {
    // Set secure HTTP-only cookies
    Cookies.set("accessToken", accessToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // expires in 1 day
      expires: 1,
    });

    Cookies.set("refreshToken", refreshToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // expires in 7 days
      expires: 7,
    });
  },

  clearAuthCookies: () => {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
  },

  getAccessToken: () => getCookie("accessToken"),
  getRefreshToken: () => getCookie("refreshToken"),

  setSettingsCookie: (key: string, value: string | number) => {
    Cookies.set(key, String(value), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: 30, // expires in 30 days
    });
  },

  getSettingsCookie: (key: string) => getCookie(key),
};

export default api;
