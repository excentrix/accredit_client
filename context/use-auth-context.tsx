"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "@/types/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const setAuthCookies = (access: string, refresh: string) => {
    Cookies.set("accessToken", access, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: 1, // 1 day
    });

    Cookies.set("refreshToken", refresh, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: 7, // 7 days
    });
  };

  const clearAuthCookies = () => {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
  };

  const refreshUserToken = async (): Promise<string | null> => {
    try {
      const refresh = Cookies.get("refreshToken");
      if (!refresh) return null;

      const response = await fetch(`${API_URL}/user/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refresh }),
      });

      const data = await response.json();

      if (response.ok && data.access) {
        Cookies.set("accessToken", data.access, {
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          expires: 1,
        });
        return data.access;
      }

      if (response.status === 401) {
        await logout();
      }

      return null;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await fetch(`${API_URL}/user/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access && data.refresh) {
        setAuthCookies(data.access, data.refresh);
        dispatch({ type: "AUTH_SUCCESS", payload: data.user });
        return true;
      } else {
        throw new Error(data.detail || "Login failed");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      return false;
    }
  };

  const logout = async () => {
    try {
      const accessToken = Cookies.get("accessToken");
      if (accessToken) {
        await fetch(`${API_URL}/user/logout/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthCookies();
      dispatch({ type: "AUTH_LOGOUT" });
      router.push("/login");
    }
  };

  const fetchUserDetails = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/user/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  const checkAuth = async () => {
    dispatch({ type: "AUTH_START" });

    try {
      let token = Cookies.get("accessToken");

      if (!token) {
        dispatch({ type: "AUTH_LOGOUT" });
        return;
      }

      let userDetails = await fetchUserDetails(token);

      if (!userDetails) {
        const newToken = await refreshUserToken();
        if (newToken) {
          userDetails = await fetchUserDetails(newToken);
        }
      }

      if (userDetails) {
        dispatch({ type: "AUTH_SUCCESS", payload: userDetails });
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await logout();
    }
  };

  // Set up automatic token refresh
  useEffect(() => {
    if (state.isAuthenticated) {
      const token = Cookies.get("accessToken");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const expiresIn = decoded.exp * 1000 - Date.now();

          // Refresh token 1 minute before expiration
          const timeoutId = setTimeout(() => {
            refreshUserToken().catch(() => logout());
          }, Math.max(0, expiresIn - 60000));

          return () => clearTimeout(timeoutId);
        } catch (error) {
          console.error("Error setting up token refresh:", error);
          logout().catch(console.error);
        }
      }
    }
  }, [state.isAuthenticated]);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, checkAuth, refreshUserToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
