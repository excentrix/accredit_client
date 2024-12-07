// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from "@/context/use-auth-context";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "@/context/settings-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/guards/route-guard";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// Define which paths should use the expanded sidebar layout
const EXPANDED_SIDEBAR_PATHS = ["/data", "/template-management"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <MainLayout>{children}</MainLayout>
              <Toaster />
            </SettingsProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // If not authenticated, render children directly (for login/register pages)
  if (!isAuthenticated) {
    return children;
  }

  const usesExpandedSidebar = EXPANDED_SIDEBAR_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // If authenticated, render the layout with sidebar
  return (
    <AuthGuard>
      <SidebarProvider
        style={
          usesExpandedSidebar
            ? ({ "--sidebar-width": "600px" } as React.CSSProperties)
            : undefined
        }
      >
        <div className="flex w-full h-screen overflow-hidden">
          <AppSidebar showSecondary={usesExpandedSidebar} />
          {usesExpandedSidebar && <SidebarTrigger className="m-2" />}
          <main className="flex-1 overflow-auto w-full">
            <div className="container mx-auto p-6 w-full">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
