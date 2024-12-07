// api.ts

import axios from "axios";
import { STORAGE_KEYS } from "@/context/settings-context";
import { needsSettings } from "./api-wrapper";
import { useAuth } from "@/context/use-auth-context";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // Updated base URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for handling cookies
});

api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem("accessToken");
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
      console.log("Refreshing token...");

      // try {
      //   const newToken = await refreshUserToken();
      //   if (newToken) {
      //     originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //     return api(originalRequest);
      //   }
      // } catch (refreshError) {
      //   // If refresh fails, logout user
      //   localStorage.removeItem("accessToken");
      //   localStorage.removeItem("refreshToken");
      //   window.location.href = "/auth/login"; // Redirect to login
      //   return Promise.reject(refreshError);
      // }
    }

    return Promise.reject(error);
  }
);

export default api;
