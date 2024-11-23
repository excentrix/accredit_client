// components/template-sections.tsx
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Template } from "@/types/template";
import { TemplateProvider, useTemplate } from "@/context/template-context";
import { SectionContent } from "./section-content";

interface TemplateSectionsProps {
  template: Template;
}

function TemplateSectionsContent({ template }: TemplateSectionsProps) {
  const {
    activeSection,
    setActiveSection,
    isLoading,
    error,
    refreshSectionData,
  } = useTemplate();

  // Refresh data when tab changes
  const handleTabChange = async (value: string) => {
    const newIndex = parseInt(value.split("-")[1]);
    setActiveSection(newIndex);
    refreshSectionData(newIndex);
  };

  return (
    <Tabs
      value={`section-${activeSection}`}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList>
        {template.metadata.map((section: any, index: number) => (
          <TabsTrigger key={index} value={`section-${index}`}>
            Section {index + 1}
            {isLoading[index] && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {template.metadata.map((section: any, index: number) => (
        <TabsContent
          key={index}
          value={`section-${index}`}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{section.headers[0]}</h2>
          </div>

          {error[index] && (
            <Alert variant="destructive">
              <AlertDescription>{error[index]}</AlertDescription>
            </Alert>
          )}

          <SectionContent
            template={template}
            section={section}
            sectionIndex={index}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function TemplateSections({ template }: TemplateSectionsProps) {
  return (
    <TemplateProvider template={template}>
      <TemplateSectionsContent template={template} />
    </TemplateProvider>
  );
}
