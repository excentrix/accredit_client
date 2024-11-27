// config/routes.ts
import { AppRoute } from "@/types/routes";

export const PUBLIC_ROUTES = ["/login", "/forgot-password"] as const;

export const DEFAULT_REDIRECT = {
  faculty: "/data-entry",
  iqac_director: "/dashboard",
  admin: "/dashboard",
} as const;

export const ROUTES: Record<string, AppRoute> = {
  login: {
    path: "/login",
    permission: {
      roles: ["faculty", "iqac_director", "admin"],
    },
    title: "Login",
    description: "Login to your account",
  },
  dashboard: {
    path: "/dashboard",
    permission: {
      roles: ["faculty", "iqac_director", "admin"],
    },
    title: "Dashboard",
    description: "Overview of your data and submissions",
  },
  dataEntry: {
    path: "/data-entry",
    permission: {
      roles: ["faculty", "iqac_director", "admin"],
    },
    title: "Data Entry",
    description: "Enter and manage your data submissions",
  },
  submissions: {
    path: "/submissions",
    permission: {
      roles: ["iqac_director", "admin"],
      redirect: "/dashboard",
    },
    title: "Submissions",
    description: "Review and manage submissions",
  },
  templateManagement: {
    path: "/template-management",
    permission: {
      roles: ["iqac_director", "admin"],
      redirect: "/dashboard",
    },
    title: "Template Management",
    description: "Manage data collection templates",
  },
  export: {
    path: "/export",
    permission: {
      roles: ["iqac_director", "admin"],
      redirect: "/dashboard",
    },
    title: "Export",
    description: "Export data and reports",
  },
  admin: {
    path: "/admin",
    permission: {
      roles: ["admin"],
      redirect: "/dashboard",
    },
    title: "Admin",
    description: "Administrative controls and settings",
  },
} as const;

export const NAVIGATION = {
  faculty: [ROUTES.dashboard, ROUTES.dataEntry],
  iqac_director: [
    ROUTES.dashboard,
    ROUTES.dataEntry,
    ROUTES.submissions,
    ROUTES.templateManagement,
    ROUTES.export,
  ],
  admin: [
    ROUTES.dashboard,
    ROUTES.dataEntry,
    ROUTES.submissions,
    ROUTES.templateManagement,
    ROUTES.export,
    ROUTES.admin,
  ],
} as const;
