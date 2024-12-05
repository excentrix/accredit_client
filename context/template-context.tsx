// contexts/TemplateContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Template } from "@/types/template";
import api from "@/lib/api";
import { useSettings } from "@/context/settings-context";

interface TemplateContextType {
  activeSection: number;
  setActiveSection: (index: number) => void;
  sectionData: { [key: number]: any[] };
  refreshSectionData: (sectionIndex: number) => Promise<void>;
  isLoading: { [key: number]: boolean };
  error: { [key: number]: string | null };
}

const TemplateContext = createContext<TemplateContextType | undefined>(
  undefined
);

export function TemplateProvider({
  children,
  template,
}: {
  children: React.ReactNode;
  template: Template;
}) {
  const {
    selectedBoard,
    selectedAcademicYear,
  } = useSettings();

  const [activeSection, setActiveSection] = useState(0);
  const [sectionData, setSectionData] = useState<{ [key: number]: any[] }>({});
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<{ [key: number]: string | null }>({});

  const refreshSectionData = useCallback(
    async (sectionIndex: number) => {
      setIsLoading((prev) => ({ ...prev, [sectionIndex]: true }));
      setError((prev) => ({ ...prev, [sectionIndex]: null }));

      try {
        const response = await api.get(
          `/templates/${template.code}/sections/${sectionIndex}/data/`, {
            params: {
              board: selectedBoard,
              academic_year: selectedAcademicYear,
            }
          }
        );

        if (response.data.status === "success") {
          setSectionData((prev) => ({
            ...prev,
            [sectionIndex]: response.data.data.rows,
          }));
        }
      } catch (err: any) {
        setError((prev) => ({
          ...prev,
          [sectionIndex]: err.response?.data?.message || "Failed to fetch data",
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, [sectionIndex]: false }));
      }
    },
    [template.code]
  );

  const value = {
    activeSection,
    setActiveSection,
    sectionData,
    refreshSectionData,
    isLoading,
    error,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error("useTemplate must be used within a TemplateProvider");
  }
  return context;
};
