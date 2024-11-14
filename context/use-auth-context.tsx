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

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await api.post("/auth/login/", {
        username,
        password,
      });

      const { data } = response;

      if (data.status === "success" && data.data) {
        // Store tokens
        localStorage.setItem("accessToken", data.data.tokens.access);
        localStorage.setItem("refreshToken", data.data.tokens.refresh);

        // Set the token in axios defaults
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.data.tokens.access}`;

        dispatch({ type: "AUTH_SUCCESS", payload: data.data.user });
        return true;
      } else {
        throw new Error(data.message || "Login failed");
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
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      dispatch({ type: "AUTH_LOGOUT" });
      // router.push("/login");
    }
  };

  const checkAuth = async () => {
    try {
      dispatch({ type: "AUTH_START" });

      // Only check if we have a token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch({ type: "AUTH_LOGOUT" });
        return;
      }

      const response = await api.get("/auth/me/");

      if (response.data.status === "success") {
        dispatch({ type: "AUTH_SUCCESS", payload: response.data.data });
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
      }}
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
