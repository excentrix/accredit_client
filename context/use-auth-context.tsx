"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "@/types/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data); // Debug log

      if (data.status === "success" && data.data) {
        // Store tokens
        localStorage.setItem("accessToken", data.data.tokens.access);
        localStorage.setItem("refreshToken", data.data.tokens.refresh);

        dispatch({ type: "AUTH_SUCCESS", payload: data.data.user });
        router.push("/dashboard");
        return true;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error); // Debug log
      const message =
        error instanceof Error ? error.message : "An error occurred";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/auth/logout/", {
        method: "POST",
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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch({ type: "AUTH_LOGOUT" });
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Check auth response:", data); // Debug log

      if (response.ok && data.status === "success") {
        dispatch({ type: "AUTH_SUCCESS", payload: data.data });
        console.log("logged in");
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      console.error("Check auth error:", error); // Debug log
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
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
