"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";
import { Template } from "@/types/template";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AddTemplateForm } from "../add-template-form";

interface TemplateFormClientProps {
  action: string;
  code?: string;
}

export function TemplateFormClient({ action, code }: TemplateFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = action === "edit";

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!isEdit || !code) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/templates/${code}`);
        setTemplate(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch template details",
          variant: "destructive",
        });
        router.push("/dashboard/template-management");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [isEdit, code]);

  const handleSuccess = () => {
    router.push("/dashboard/template-management");
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/template-management")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Edit Template" : "Add Template"}
        </h1>
        <p className="text-muted-foreground">
          {isEdit
            ? "Update template details and structure"
            : "Create a new data collection template"}
        </p>
      </div>

      <AddTemplateForm initialData={template} onSuccess={handleSuccess} />
    </div>
  );
}