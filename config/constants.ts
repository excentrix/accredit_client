// config/constants.ts
export const APP_NAME = "Accredit";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    LOGOUT: "/auth/logout/",
    ME: "/auth/me/",
    REFRESH: "/auth/refresh/",
  },
  TEMPLATES: {
    BASE: "/templates/",
    IMPORT: "/templates/import-excel/",
    EXPORT: "/templates/export/",
  },
  SUBMISSIONS: {
    BASE: "/submissions/",
    STATS: "/submissions/stats/",
    DEPARTMENT_BREAKDOWN: "/submissions/department-breakdown/",
  },
  BOARDS: {
    BASE: "/boards/",
  },
} as const;

export const ROWS_PER_PAGE = 10;

export const DATE_FORMAT = "DD/MM/YYYY";

export const STATUS_COLORS = {
  draft: "gray",
  submitted: "blue",
  approved: "green",
  rejected: "red",
} as const;

export const SUBMISSION_STATES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const FILE_TYPES = {
  EXCEL: ".xlsx",
  PDF: ".pdf",
} as const;

export const ERROR_MESSAGES = {
  GENERIC: "Something went wrong. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  SESSION_EXPIRED: "Your session has expired. Please login again.",
} as const;

export const SUCCESS_MESSAGES = {
  SAVED: "Changes saved successfully.",
  SUBMITTED: "Submitted successfully.",
  APPROVED: "Approved successfully.",
  REJECTED: "Rejected successfully.",
  DELETED: "Deleted successfully.",
} as const;
