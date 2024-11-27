// config/query.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      //   cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const queryKeys = {
  auth: {
    user: ["auth", "user"],
  },
  templates: {
    all: ["templates"],
    byBoard: (boardCode: string) => ["templates", "board", boardCode],
    byCode: (code: string) => ["templates", "code", code],
  },
  submissions: {
    all: ["submissions"],
    stats: ["submissions", "stats"],
    departmentBreakdown: ["submissions", "department-breakdown"],
    byId: (id: number) => ["submissions", id],
  },
  boards: {
    all: ["boards"],
  },
} as const;
