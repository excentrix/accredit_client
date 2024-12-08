export const publicRoutes = [
  "/login",
  "/auth/register",
  "/auth/forgot-password",
  // Add other public routes
];

export function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname.startsWith(route));
}
