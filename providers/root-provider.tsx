// providers/root-provider.tsx
"use client";

import { AuthProvider } from "./auth-provider";
import { SettingsProvider } from "./settings-provider";
import { ToastProvider } from "./toast-provider";
import { QueryProvider } from "./query-provider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider />
          {children}
        </SettingsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
