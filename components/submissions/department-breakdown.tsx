// components/submissions/department-breakdown.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { academicYearServices, submissionStatsServices } from "@/services/core";

interface DepartmentBreakdownProps {
  initialAcademicYear?: number; // Changed to number for ID
}

export function DepartmentBreakdown({
  initialAcademicYear,
}: DepartmentBreakdownProps) {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    initialAcademicYear
  );

  const router = useRouter();

  const handleReviewClick = (submissionId: string) => {
    router.push(`/dashboard/submissions/${submissionId}`);
  };

  // Fetch academic years
  const { data: academicYearsResponse, isLoading: isLoadingYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const response = await academicYearServices.fetchAcademicYears();
      return response;
    },
  });

  // Fetch breakdown
  const {
    data: breakdownResponse,
    isLoading: isLoadingBreakdown,
    error,
  } = useQuery({
    queryKey: ["department-breakdown", selectedYear],
    queryFn: async () => {
      const response = await submissionStatsServices.fetchDepartmentBreakdown(
        selectedYear
      );
      return response.data;
    },
    enabled: !!selectedYear,
  });

  if (isLoadingYears || isLoadingBreakdown) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  //   if (error) {
  //     return (
  //       <div className="p-8 text-center">
  //         <p className="text-red-500">Error loading data. Please try again.</p>
  //       </div>
  //     );
  //   }

  const academicYears = academicYearsResponse?.data || [];
  const breakdown = breakdownResponse;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedYear?.toString()}
          onValueChange={(value) => setSelectedYear(Number(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year: any) => (
              <SelectItem key={year.id} value={year.id.toString()}>
                {year.name} {/* Changed from year to name */}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Submission Progress</CardTitle>
          <CardDescription>
            Track department-wise submission status for all criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Total Progress ({breakdown?.overall_completion_rate}%)
                </p>
                <p className="text-sm text-muted-foreground">
                  {breakdown?.completed_submissions} of{" "}
                  {breakdown?.total_required_submissions} submissions completed
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            <Progress value={breakdown?.overall_completion_rate} />
          </div>
        </CardContent>
      </Card>

      {/* Department-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Submission Status</CardTitle>
          <CardDescription>
            Detailed breakdown of submissions by department and criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {breakdown?.departments?.map((dept: any) => (
              <AccordionItem key={dept.id} value={dept.id.toString()}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{dept.name}</span>
                      <Badge
                        variant={
                          dept.completion_rate === 100
                            ? "default"
                            : dept.completion_rate > 50
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {dept.completion_rate}% Complete
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {dept.completed_submissions}/{dept.total_required}{" "}
                        Templates
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Code</TableHead>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dept.templates.map((template: any) => (
                        <TableRow key={template.code}>
                          <TableCell className="font-medium">
                            {template.code}
                          </TableCell>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {template.status === "approved" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : template.status === "rejected" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : template.status === "submitted" ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              ) : null}
                              <span
                                className={
                                  template.status === "approved"
                                    ? "text-green-500"
                                    : template.status === "rejected"
                                    ? "text-red-500"
                                    : template.status === "submitted"
                                    ? "text-yellow-500"
                                    : ""
                                }
                              >
                                {template.status.charAt(0).toUpperCase() +
                                  template.status.slice(1)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.last_updated
                              ? new Date(
                                  template.last_updated
                                ).toLocaleDateString()
                              : "Not submitted"}
                          </TableCell>
                          <TableCell>
                            {template.submission_id && ( // Add submission_id to your API response
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleReviewClick(template.submission_id)
                                }
                              >
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
