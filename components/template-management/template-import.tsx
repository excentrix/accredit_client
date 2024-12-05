"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

import api from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useSettings } from "@/context/settings-context";

export function TemplateImport({ onSuccess }: { onSuccess: () => void }) {
  const {
    selectedBoard,
    selectedAcademicYear,
  } = useSettings();
  
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith(".xlsx")) {
      showToast.error("Please upload an Excel file (.xlsx)");
      return;
    }

    // Validate filename format (should be like 2.1.1.xlsx)
    const templateCode = file.name.split(".xlsx")[0];
    if (!/^\d+(\.\d+)*$/.test(templateCode)) {
      showToast.error("File name should be in format like '2.1.1.xlsx'");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const response = await api.post("/templates/import-excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          board: selectedBoard,
          academic_year: selectedAcademicYear,
        },
      });

      if (response.data.status === "success") {
        showToast.success(response.data.message);
        onSuccess();
      }
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Failed to import template"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleImport}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? "Importing..." : "Import Template"}
      </Button>
    </div>
  );
}
