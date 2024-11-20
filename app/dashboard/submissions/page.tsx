// app/(dashboard)/iqac/submissions/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { DepartmentBreakdown } from "@/components/submissions/department-breakdown";
import { SubmissionList } from "@/components/submissions/submission-list";
import api from "@/lib/api";

export default function IQACSubmissionsPage() {
  const { data: currentYear, isLoading } = useQuery({
    queryKey: ["current-academic-year"],
    queryFn: async () => {
      const response = await api.get("/academic-years/current/");
      return response.data.data; // Access the nested data property
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review Submissions</h1>
          <p className="text-muted-foreground">
            Review and manage department submissions
          </p>
        </div>

        <SubmissionList />
        <DepartmentBreakdown initialAcademicYear={currentYear?.id} />
      </div>
    </div>
  );
}