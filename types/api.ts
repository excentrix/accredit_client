// types/api.ts
export interface ApiResponse<T = any> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
