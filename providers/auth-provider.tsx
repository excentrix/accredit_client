// providers/auth-provider.tsx
"use client";

import React, { createContext, useReducer, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, AuthState } from "@/types/auth";
import { authService } from "@/services";
import * as tokenUtils from "@/lib/utils/token";

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

      const response = await authService.login({ username, password });

      if (response.status === "success" && response.data) {
        const { user, tokens } = response.data;
        tokenUtils.setTokenCookies(tokens);
        dispatch({ type: "AUTH_SUCCESS", payload: user });
        router.push("/dashboard");
        return true;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error instanceof Error ? error.message : "An error occurred";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenUtils.clearTokenCookies();
      dispatch({ type: "AUTH_LOGOUT" });
      router.push("/login");
    }
  };

  const checkAuth = async () => {
    try {
      const { accessToken, refreshToken } = tokenUtils.getTokenFromRequest({
        cookies: {
          get: (name: string) => ({
            value:
              document.cookie.match(new RegExp(`${name}=([^;]+)`))?.[1] || null,
          }),
        },
      } as any);

      const { isValid, tokens } = await tokenUtils.validateTokens(
        accessToken,
        refreshToken
      );

      if (!isValid) {
        dispatch({ type: "AUTH_LOGOUT" });
        return;
      }

      if (tokens && tokens !== { accessToken, refreshToken }) {
        tokenUtils.setTokenCookies(tokens);
      }

      const response = await authService.getCurrentUser();

      if (response.status === "success" && response.data) {
        dispatch({ type: "AUTH_SUCCESS", payload: response.data });
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      console.error("Check auth error:", error);
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

export { AuthContext };
