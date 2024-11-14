export type UserRole = "faculty" | "iqac_director" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  status: "success" | "error";
  data?: {
    user: User;
    tokens: {
      access: string;
      refresh: string;
    };
  };
  message?: string;
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
