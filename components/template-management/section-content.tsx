// components/section-content.tsx
import { useState } from "react";
import { Template } from "@/types/template";
import { Maximize2, Minimize2 } from "lucide-react";
import { SectionDataEntryForm } from "./section-data-entry-form";
import { SectionDataTable } from "./section-data-table";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface SectionContentProps {
  template: Template;
  section: any;
  sectionIndex: number;
}

export function SectionContent({
  template,
  section,
  sectionIndex,
}: SectionContentProps) {
  const [view, setView] = useState<"split" | "form" | "table">("split");

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 flex gap-2 z-10">
        {view === "split" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("form")}
              className="flex items-center gap-1"
            >
              <Maximize2 className="h-4 w-4" />
              Expand Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("table")}
              className="flex items-center gap-1"
            >
              <Maximize2 className="h-4 w-4" />
              Expand Table
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("split")}
            className="flex items-center gap-1"
          >
            <Minimize2 className="h-4 w-4" />
            Split View
          </Button>
        )}
      </div>

      <div className="flex gap-4 mt-12">
        <div
          className={cn(
            "transition-all duration-300",
            view === "table" ? "hidden" : view === "form" ? "w-full" : "w-1/2"
          )}
        >
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="font-medium mb-4">Add New Entry</h3>
            <SectionDataEntryForm
              template={template}
              section={section}
              sectionIndex={sectionIndex}
            />
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-300",
            view === "form" ? "hidden" : view === "table" ? "w-full" : "w-1/2"
          )}
        >
          <SectionDataTable
            template={template}
            section={section}
            sectionIndex={sectionIndex}
          />
        </div>
      </div>
    </div>
  );
}
