export interface User {
  id: number;
  email: string;
  username: string;
  usn: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  roles: Role[];
  department?: Department;
  individual_permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}
export interface Module {
  id: string;
  name: string;
  description?: string;
}
export interface Permission {
  id: number;
  module: Module;
  module_name: string;
  resource: string;
  action: string;
  codename: string;
  description: string;
  full_codename: string;
  roles?: Role[];
}

// types/auth.ts
export interface UserPermission extends Permission {
  source: "direct" | "role";
  role_name?: string; // if from role
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// types/api.ts
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
