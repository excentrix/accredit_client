"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/use-auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "600px",
        } as React.CSSProperties
      }
    >
      <div className="flex w-full h-screen overflow-hidden">
        <AppSidebar />
        <Toaster />
        <main className="flex-1 overflow-auto w-full">
          <div className="container mx-auto p-6 w-full">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
