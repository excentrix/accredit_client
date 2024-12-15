// services/user_management.ts
import api from "./api";
import { Role, Department, UserUpdateData } from "@/types/auth";
import Cookies from "js-cookie";

const userManagementService = {
  // Authentication Endpoints
  login: async (email: string, password: string) => {
    const response = await api.post("/user/token/", { email, password });
    return response.data;
  },

  refreshAccessToken: async (refreshToken: string) => {
    const response = await api.post("/user/token/refresh/", {
      refresh: refreshToken,
    });
    return response.data;
  },

  logout: async () => {
    const refreshToken = Cookies.get("refreshToken");
    const response = await api.post("/user/logout/", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // User Management
  fetchUsers: async (params: any = {}) => {
    const response = await api.get("/user/users/", { params });
    return response.data.results;
  },

  fetchCurrentUser: async () => {
    const response = await api.get("/user/users/me/");
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
    usn: string;
    first_name?: string;
    last_name?: string;
    department_id: string;
    role_ids: number[];
    is_active: boolean;
    password?: string;
    confirm_password?: string;
  }) => {
    console.log(userData);
    const response = await api.post("/user/register/", userData);

    return response.data;
  },

  updateUser: async (userId: number, userData: UserUpdateData) => {
    const response = await api.put(`/user/users/${userId}/`, userData);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    await api.delete(`/user/users/${userId}/`);
  },

  // Role Management
  fetchRoles: async () => {
    const response = await api.get("/user/roles/");
    return response.data.results;
  },

  fetchRole: async (roleId: string) => {
    const response = await api.get(`/user/roles/${roleId}/`);
    return response.data;
  },

  createRole: async (roleData: {
    name: string;
    description?: string;
    permission_ids?: number[];
  }) => {
    const response = await api.post("/user/roles/", roleData);
    return response.data;
  },

  updateRole: async (roleId: string, roleData: Partial<Role>) => {
    const response = await api.put(`/user/roles/${roleId}/`, roleData);
    return response.data;
  },

  deleteRole: async (roleId: string) => {
    await api.delete(`/user/roles/${roleId}/`);
  },

  // Role Users Management
  fetchRoleUsers: async (roleId: string) => {
    const response = await api.get(`/user/roles/${roleId}/users/`);
    return response.data.results;
  },

  assignRole: async (userId: number, roleId: string) => {
    const response = await api.post(`/user/users/${userId}/assign-role/`, {
      role_id: roleId,
    });
    return response.data;
  },

  revokeRole: async (userId: number, roleId: string) => {
    await api.post(`/user/users/${userId}/revoke-role/`, {
      role_id: roleId,
    });
  },

  // Role Permissions Management
  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await api.put(`/user/roles/${roleId}/permissions/`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },

  // Permission Management
  fetchPermissions: async () => {
    const response = await api.get("/user/permissions/");
    return response.data.results || [];
  },

  fetchPermissionsByModule: async (module: string) => {
    const response = await api.get(`/user/permissions/`, {
      params: { module },
    });
    return response.data.results;
  },

  fetchPermissionsByResource: async (resource: string) => {
    const response = await api.get(`/user/permissions/`, {
      params: { resource },
    });
    return response.data.results;
  },

  // User Permissions Management
  fetchUserPermissions: async (userId: number) => {
    const response = await api.get(`/user/users/${userId}/permissions/`);
    return response.data || [];
  },

  fetchUserDirectPermissions: async (userId: number) => {
    const response = await api.get(`/user/users/${userId}/direct_permissions/`);
    return response.data || [];
  },

  fetchUserRolePermissions: async (userId: number) => {
    const response = await api.get(`/user/users/${userId}/role_permissions/`);
    return response.data || [];
  },

  assignPermissionToUser: async (userId: number, permissionId: string) => {
    const response = await api.post(
      `/user/users/${userId}/assign_permission/`,
      {
        permission_id: permissionId,
      }
    );
    return response.data;
  },

  revokePermissionFromUser: async (userId: number, permissionId: string) => {
    const response = await api.delete(
      `/user/users/${userId}/permissions/${permissionId}/`
    );
    return response.data;
  },

  // Department Management
  fetchDepartments: async () => {
    const response = await api.get("/user/departments/");
    return response.data.results;
  },

  createDepartment: async (departmentData: {
    name: string;
    code: string;
    description?: string;
  }) => {
    const response = await api.post("/user/departments/", departmentData);
    return response.data;
  },

  updateDepartment: async (
    departmentId: number,
    departmentData: Partial<Department>
  ) => {
    const response = await api.put(
      `/user/departments/${departmentId}/`,
      departmentData
    );
    return response.data;
  },

  deleteDepartment: async (departmentId: number) => {
    await api.delete(`/user/departments/${departmentId}/`);
  },

  // Department Users Management
  fetchDepartmentUsers: async (departmentId: number) => {
    const response = await api.get(`/user/departments/${departmentId}/users/`);
    return response.data.results;
  },

  assignUserToDepartment: async (userId: number, departmentId: string) => {
    const response = await api.put(`/user/users/${userId}/department/`, {
      department_code: departmentId,
    });
    return response.data;
  },

  removeUserFromDepartment: async (userId: number) => {
    await api.delete(`/user/users/${userId}/department/`);
  },

  // Password Management
  changePassword: async (
    userId: number,
    passwords: {
      current_password: string;
      new_password: string;
    }
  ) => {
    const response = await api.post(
      `/user/users/${userId}/change-password/`,
      passwords
    );
    return response.data;
  },

  resetPasswordRequest: async (email: string) => {
    const response = await api.post("/user/reset-password-request/", { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/user/reset-password/", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  // Audit Log
  fetchAuditLogs: async (
    params: {
      user_id?: number;
      action?: string;
      module?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      page_size?: number;
    } = {}
  ) => {
    const response = await api.get("/user/audit-logs/", { params });
    return response.data;
  },

  // User Session Management
  fetchUserSessions: async (userId: number) => {
    const response = await api.get(`/user/users/${userId}/sessions/`);
    return response.data.results;
  },

  terminateSession: async (userId: number, sessionId: string) => {
    await api.delete(`/user/users/${userId}/sessions/${sessionId}/`);
  },

  terminateAllSessions: async (userId: number) => {
    await api.delete(`/user/users/${userId}/sessions/`);
  },
};

export const auditServices = {
  fetchAuditLogs: (params?: { type?: string; days?: number }) =>
    api.get("/user/audit-logs/", { params }).then((res) => res.data),

  exportAuditLogs: (params?: { type?: string; days?: number }) =>
    api
      .get("/user/audit-logs/export/", {
        params,
        responseType: "blob",
      })
      .then((res) => {
        // Create and trigger download
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        const fileName = `audit_logs_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }),

  fetchAuditSummary: (params?: { days?: number }) =>
    api.get("/user/audit-logs/summary/", { params }).then((res) => res.data),
};

export default userManagementService;
