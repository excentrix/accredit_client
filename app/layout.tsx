
"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from "@/context/use-auth-context";
import { Toaster } from "react-hot-toast";
import { Settings } from "lucide-react";
import { SettingsProvider } from "@/context/settings-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const inter = Inter({ subsets: ["latin"] });

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const sidebarStyle = pathname.startsWith('/data')
    ? { "--sidebar-width": "600px" } // Apply extra styling
    : {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider
        style={sidebarStyle as React.CSSProperties}
      >
        <div className="flex w-full h-screen overflow-hidden">
          <AppSidebar />
          <SidebarTrigger className="m-2" />
          <main className="flex-1 overflow-auto w-full">
            <div className="container mx-auto p-6 w-full">{children}</div>
          </main>
        </div>
      </SidebarProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}