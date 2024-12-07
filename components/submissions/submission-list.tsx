// components/submissions/submission-list.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { formatDistance, format } from "date-fns";
import { SubmissionReview } from "./submission-review";
import { useQuery } from "@tanstack/react-query";
import { SubmissionStats } from "./submission-stats";
import { useRouter } from "next/navigation";
import { submissionStatsServices } from "@/services/core";
import userManagementService from "@/services/user_management";

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
} as const;

interface Submission {
  id: number;
  department_name: string;
  template_code: string;
  status: keyof typeof statusColors;
  submitted_by_name: string;
  submitted_at: string;
  department: number;
}

interface SubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export function SubmissionList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);

  const router = useRouter();

  const handleReviewClick = (submissionId: string) => {
    router.push(`/submissions/${submissionId}`);
  };

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await userManagementService.fetchDepartments();
        // console.log(departments);
        setDepartments(response);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch submissions with React Query
  const {
    data: submissions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["submissions", searchQuery, statusFilter, departmentFilter],
    queryFn: async () => {
      const response =
        await submissionStatsServices.fetchCurrentAcademicYearSubmissions({
          searchQuery,
          statusFilter,
          departmentFilter,
        });
      return response;
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <SubmissionStats />
      {/* Filters Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by department or template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : submissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No submissions found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              submissions?.map((submission: Submission) => (
                <TableRow
                  key={submission.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleReviewClick(submission.id.toString())}
                >
                  <TableCell>{submission.template_code}</TableCell>
                  <TableCell>{submission.department_name}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[submission.status]}`}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{submission.submitted_by_name}</TableCell>
                  <TableCell>
                    {submission.submitted_at ? (
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {format(new Date(submission.submitted_at), "PPP")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(
                            new Date(submission.submitted_at),
                            new Date(),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                    ) : (
                      "Not submitted"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SubmissionReview
                      templateCode={submission.template_code}
                      submission={submission}
                      departmentId={submission.department}
                      onReviewComplete={() => refetch()}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
