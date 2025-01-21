// app/(dashboard)/iqac/submissions/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { DepartmentBreakdown } from "@/components/submissions/department-breakdown";
import { SubmissionList } from "@/components/submissions/submission-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListIcon } from "lucide-react";
import { academicYearServices } from "@/services/core";
import { useSettings } from "@/context/settings-context";


export default function IQACSubmissionsPage() {
  const { selectedBoard, selectedAcademicYear } = useSettings();
  const { data: currentYear, isLoading } = useQuery({
    queryKey: ["current-academic-year", selectedBoard, selectedAcademicYear],
    queryFn: async () => {
      const response = await academicYearServices.fetchCurrentAcademicYear();
      return response.data; // Access the nested data property
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Review Submissions</h1>
            <p className="text-muted-foreground">
              Review and manage department submissions
            </p>
          </div>
            {/* <Link href="/submissions/all">
              <Button>
                <ListIcon className="mr-2 h-4 w-4" />
                  View All Submissions
              </Button>
            </Link>    */}
        </div>

        <SubmissionList />
        <DepartmentBreakdown />
      </div>
    </div>
  );
}
