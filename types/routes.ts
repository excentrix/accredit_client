import { UserRole } from "./auth";

export type RoutePermission = {
  roles: UserRole[];
  redirect?: string;
};

export type AppRoute = {
  path: string;
  permission: RoutePermission;
  title: string;
  description?: string;
};
    