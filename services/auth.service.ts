// services/auth.service.ts
import api from "@/lib/api";
import { ApiResponse, LoginResponse, User } from "../types";

export const authService = {
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login/",
      credentials
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout/");
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>("/auth/me/");
    return response.data;
  },

  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<{ access: string }>> {
    const response = await api.post<ApiResponse<{ access: string }>>(
      "/auth/refresh/",
      {
        refresh: refreshToken,
      }
    );
    return response.data;
  },
};
