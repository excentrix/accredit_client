import { Role } from "./auth";

export type RoutePermission = {
  roles: Role[];
  redirect?: string;
};

export type AppRoute = {
  path: string;
  permission: RoutePermission;
  title: string;
  description?: string;
};
