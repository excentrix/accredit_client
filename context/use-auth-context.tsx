// context/use-auth-context.tsx

"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "@/types/auth";
import { useRouter } from "next/navigation";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const refreshUserToken = async (): Promise<string | null> => {
    try {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) return null;

      const response = await fetch(
        "http://127.0.0.1:8000/user/token/refresh/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ refresh }),
        }
      );

      const data = await response.json();

      if (response.ok && data.access) {
        localStorage.setItem("accessToken", data.access);
        return data.access;
      }

      // If refresh failed, logout
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

      const response = await fetch("http://127.0.0.1:8000/user/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access && data.refresh) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);

        dispatch({ type: "AUTH_SUCCESS", payload: data.user });
        router.push("/dashboard");
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
      const token = localStorage.getItem("accessToken");
      await fetch("http://127.0.0.1:8000/user/logout/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      dispatch({ type: "AUTH_LOGOUT" });
      router.push("/login");
    }
  };

  const fetchUserDetails = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/user/users/me/", {
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
      let token = localStorage.getItem("accessToken");

      if (!token) {
        dispatch({ type: "AUTH_LOGOUT" });
        return;
      }

      // Try to get user details with current token
      let userDetails = await fetchUserDetails(token);

      // If failed, try to refresh token
      if (!userDetails) {
        const newToken = await refreshUserToken();
        if (newToken) {
          userDetails = await fetchUserDetails(newToken);
        }
      }

      if (userDetails) {
        dispatch({ type: "AUTH_SUCCESS", payload: userDetails });
      } else {
        // If both attempts failed, logout
        await logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await logout();
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          // Decode token to get expiration time
          const payload = JSON.parse(atob(token.split(".")[1]));
          const expiresIn = payload.exp * 1000 - Date.now();

          // Set up refresh 1 minute before expiration
          const timeoutId = setTimeout(() => {
            refreshUserToken().then((newToken) => {
              if (!newToken) {
                logout();
              }
            });
          }, Math.max(0, expiresIn - 60000));

          return () => clearTimeout(timeoutId);
        } catch (error) {
          console.error("Error setting up token refresh:", error);
        }
      }
    }
  }, [state.isAuthenticated]);

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
