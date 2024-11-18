// app/dashboard/data-management/[templateCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Template } from "@/types/template";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export default function TemplateDataPage() {
  const params = useParams();
  const { toast } = useToast();
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
        toast({
          title: "Error",
          description: "Failed to fetch template details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.templateCode, toast]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground">
            Template Code: {template.code}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          {/* <Button>Add Entry</Button> */}
        </div>
      </div>

      {/* {template.description && (
        <p className="text-muted-foreground">{template.description}</p>
      )} */}

      <DataTable template={template} />
    </div>
  );
}
