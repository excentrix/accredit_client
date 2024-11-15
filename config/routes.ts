import { AppRoute } from "@/types/routes";

export const ROUTES: Record<string, AppRoute> = {
  dashboard: {
    path: "/dashboard",
    permission: {
      roles: ["faculty", "iqac_director", "admin"],
    },
    title: "Dashboard",
  },
  data: {
    path: "/data",
    permission: {
      roles: ["faculty", "iqac_director", "admin"],
    },
    title: "Data",
  },
  templateManagement: {
    path: "/template-management",
    permission: {
      roles: ["iqac_director", "admin"],
    },
    title: "Template Management",
    description: "Manage and review department submissions",
  },
  templates: {
    path: "/templates",
    permission: {
      roles: ["iqac_director", "admin"],
    },
    title: "Template Management",
  },
  users: {
    path: "/users",
    permission: {
      roles: ["admin"],
    },
    title: "User Management",
  },
  departments: {
    path: "/departments",
    permission: {
      roles: ["admin"],
    },
    title: "Department Management",
  },
  settings: {
    path: "/settings",
    permission: {
      roles: ["admin"],
    },
    title: "System Settings",
  },
};
