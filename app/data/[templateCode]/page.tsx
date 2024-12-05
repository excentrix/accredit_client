// app/dashboard/data-management/[templateCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Template } from "@/types/template";
import api from "@/lib/api";

import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { TemplateSections } from "@/components/template-management/template-sections";
import { showToast } from "@/lib/toast";
import { SubmissionStatus } from "@/components/submission-status";
import { SubmissionProvider } from "@/context/submission-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function TemplateDataPage() {
  const params = useParams();

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!params.templateCode) return;

      try {
        setIsLoading(true);
        console.log("Fetching template:", params.templateCode); // Debug log

        const response = await api.get(`/templates/${params.templateCode}`);
        console.log("Template response:", response.data); // Debug log

        if (response.data) {
          setTemplate(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch template:", error);
        showToast.error("Failed to fetch template details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.templateCode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-muted-foreground">Template not found</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
      <SubmissionProvider templateCode={template.code}>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <p className="text-muted-foreground">
                Template Code: {template.code}
              </p>
            </div>
            <SubmissionStatus />

            <TemplateSections template={template} />
          </div>
        </div>
      </SubmissionProvider>
  );
}
