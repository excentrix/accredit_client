// app/(dashboard)/iqac/submissions/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { DepartmentBreakdown } from "@/components/submissions/department-breakdown";
import { SubmissionList } from "@/components/submissions/submission-list";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListIcon } from "lucide-react";
import { academicYearServices } from "@/services/core";

export default function IQACSubmissionsPage() {
  const { data: currentYear, isLoading } = useQuery({
    queryKey: ["current-academic-year"],
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
          <Button asChild>
            <Link href="/submissions/all">
              <ListIcon className="mr-2 h-4 w-4" />
              View All Submissions
            </Link>
          </Button>
        </div>

        <SubmissionList />
        <DepartmentBreakdown initialAcademicYear={currentYear?.id} />
      </div>
    </div>
  );
}
