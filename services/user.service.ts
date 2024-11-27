// services/user.service.ts
import api from "@/lib/api";
import { ApiResponse, User } from "../types";

export const userService = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await api.get<ApiResponse<User[]>>("/users/");
    return response.data;
  },

  async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}/`);
    return response.data;
  },

  async updateUser(
    id: number,
    data: Partial<User>
  ): Promise<ApiResponse<User>> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/`, data);
    return response.data;
  },

  async changePassword(
    id: number,
    passwords: {
      current_password: string;
      new_password: string;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      `/users/${id}/change-password/`,
      passwords
    );
    return response.data;
  },
};
