// lib/utils/token.ts
import { jwtVerify, JWTPayload as JoseJWTPayload } from "jose";
import { NextRequest } from "next/server";
import { UserRole } from "@/types/auth";

interface JWTPayload extends JoseJWTPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  role: UserRole;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

export async function verifyToken(token: string): Promise<string> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-default-secret"
    );

    const { payload } = await jwtVerify(token, secret);
    const jwtPayload = payload as unknown as JWTPayload;

    // Check if token is expired
    if (isTokenExpired(token)) {
      throw new Error("Token has expired");
    }

    return jwtPayload.role;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeToken(token);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return payload.exp < currentTimestamp;
  } catch {
    return true;
  }
}

export function decodeToken(token: string): JWTPayload {
  try {
    return JSON.parse(atob(token.split(".")[1])) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token format");
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error("Refresh token failed");
    }

    const data = await response.json();
    return data.data.tokens;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  try {
    const accessToken = request.cookies.get("accessToken")?.value || null;
    const refreshToken = request.cookies.get("refreshToken")?.value || null;

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error getting tokens:", error);
    return { accessToken: null, refreshToken: null };
  }
}

// New utility functions

export function setTokenCookies(tokens: TokenResponse): void {
  const secure = process.env.NODE_ENV === "production";
  const accessMaxAge = 60 * 60 * 24 * 7; // 7 days
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days

  document.cookie = `accessToken=${
    tokens.access
  }; path=/; max-age=${accessMaxAge}; samesite=lax${secure ? "; secure" : ""}`;
  document.cookie = `refreshToken=${
    tokens.refresh
  }; path=/; max-age=${refreshMaxAge}; samesite=lax${secure ? "; secure" : ""}`;
}

export function clearTokenCookies(): void {
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
}

export function getUserFromToken(token: string): {
  userId: number;
  role: UserRole;
} | null {
  try {
    const payload = decodeToken(token);
    return {
      userId: payload.user_id,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const payload = decodeToken(token);
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export function shouldRefreshToken(
  token: string,
  thresholdMinutes = 5
): boolean {
  try {
    const payload = decodeToken(token);
    const expirationTime = payload.exp * 1000;
    const thresholdMs = thresholdMinutes * 60 * 1000;
    return Date.now() + thresholdMs >= expirationTime;
  } catch {
    return true;
  }
}

export async function validateTokens(
  accessToken: string | null,
  refreshToken: string | null
): Promise<{
  isValid: boolean;
  tokens: TokenResponse | null;
}> {
  if (!accessToken || !refreshToken) {
    return { isValid: false, tokens: null };
  }

  // Check if access token is still valid
  if (!isTokenExpired(accessToken)) {
    return {
      isValid: true,
      tokens: { access: accessToken, refresh: refreshToken },
    };
  }

  // Try to refresh the token
  const newTokens = await refreshAccessToken(refreshToken);
  if (newTokens) {
    return { isValid: true, tokens: newTokens };
  }

  return { isValid: false, tokens: null };
}
