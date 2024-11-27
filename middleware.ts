// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyToken,
  getTokenFromRequest,
  isTokenExpired,
  refreshAccessToken,
} from "@/lib/utils/token";

const protectedRoutes = {
  "/data-entry": ["faculty", "iqac_director", "admin"],
  "/submissions": ["iqac_director", "admin"],
  "/template-management": ["iqac_director", "admin"],
  "/export": ["iqac_director", "admin"],
  "/admin": ["admin"],
} as const;

type Role = keyof typeof protectedRoutes;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (pathname.startsWith("/login")) {
    const { accessToken } = getTokenFromRequest(request);
    if (accessToken && !isTokenExpired(accessToken)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Get tokens from request
  const { accessToken, refreshToken } = getTokenFromRequest(request);
  let currentAccessToken = accessToken;
  let response = NextResponse.next();

  // No tokens available, redirect to login
  if (!accessToken || !refreshToken) {
    return handleUnauthorized(request);
  }

  try {
    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      if (!refreshToken) {
        return handleUnauthorized(request);
      }

      // Try to refresh the access token
      const newTokens = await refreshAccessToken(refreshToken);
      if (!newTokens) {
        return handleUnauthorized(request);
      }

      // Update the access token
      currentAccessToken = newTokens.access;
      response = NextResponse.next();

      // Set new tokens in cookies
      response.cookies.set("accessToken", newTokens.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      response.cookies.set("refreshToken", newTokens.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Verify token and get user role
    const userRole = await verifyToken(currentAccessToken);

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        console.warn(
          `Unauthorized access attempt to ${route} by user with role ${userRole}`
        );
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Add user role and token to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-role", userRole);
    requestHeaders.set("authorization", `Bearer ${currentAccessToken}`);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware error:", error);
    return handleUnauthorized(request);
  }
}

function handleUnauthorized(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|static|[\\w-]+\\.\\w+).*)"],
};
