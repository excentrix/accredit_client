import api from "./api";

const userManagementService = {
  // Authentication Endpoints
  login: async (username: string, password: string) => {
    const response = await api.post("/user/token/", { username, password });
    return response.data;
  },

  refreshAccessToken: async (refreshToken: string) => {
    const response = await api.post("/user/token/refresh/", {
      refresh: refreshToken,
    });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await api.post("/user/logout/", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // User Registration and Management
  registerUser: async (userDetails: any) => {
    const response = await api.post("/user/register/", userDetails);
    return response.data;
  },

  fetchCurrentUser: async () => {
    const response = await api.get("/user/users/me/");
    return response.data;
  },

  fetchUsers: async (params: any = {}) => {
    const response = await api.get("/user/users/", { params });
    return response.data;
  },

  assignRole: async (userId: string, role: string) => {
    const response = await api.post(`/user/users/${userId}/assign_role/`, {
      role,
    });
    return response.data;
  },

  revokeRole: async (userId: string, role: string) => {
    const response = await api.post(`/user/users/${userId}/revoke_role/`, {
      role,
    });
    return response.data;
  },

  // Password Management
  resetPasswordRequest: async (email: string) => {
    const response = await api.post("/user/reset-password-request/", { email });
    return response.data;
  },

  resetPasswordConfirm: async (token: string, newPassword: string) => {
    const response = await api.post("/user/reset-password/", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/user/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Role and Permission Management
  fetchRoles: async () => {
    const response = await api.get("/user/roles/");
    return response.data;
  },

  fetchPermissions: async () => {
    const response = await api.get("/user/permissions/");
    return response.data;
  },

  fetchDepartments: async () => {
    const response = await api.get("/user/departments/");
    console.log("2", response);
    return response.data.results;
  },
};

export default userManagementService;
