// types/auth.ts
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
  is_active: boolean;
  last_login?: string;
  date_joined: string;
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

export interface TokenPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  role: UserRole;
}
