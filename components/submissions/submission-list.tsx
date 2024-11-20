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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Search,
  ListChecks,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { formatDistance, format } from "date-fns";
import { showToast } from "@/lib/toast";
import api from "@/lib/api";
import { SubmissionReview } from "./submission-review";
import { useQuery } from "@tanstack/react-query";
import { SubmissionStats } from "./submission-stats";

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

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments/");
        setDepartments(response.data);
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
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (departmentFilter !== "all")
        params.append("department", departmentFilter);

      const response = await api.get(
        `/submissions/current_academic_year/?${params.toString()}`
      );
      return response.data;
    },
  });

  // Fetch stats with React Query
  const { data: stats, isLoading: isLoadingStats } = useQuery<SubmissionStats>({
    queryKey: ["submission-stats"],
    queryFn: async () => {
      const response = await api.get("/submissions/stats/");
      console.log(response.data);
      return response.data;
    },
  });

  const statCards = [
    {
      title: "Pending Review",
      value: stats?.pending || 0,
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      description: "Awaiting review",
      color: "border-l-4 border-l-yellow-500",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      description: "Successfully approved",
      color: "border-l-4 border-l-green-500",
    },
    {
      title: "Rejected",
      value: stats?.rejected || 0,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      description: "Needs revision",
      color: "border-l-4 border-l-red-500",
    },
    {
      title: "Total Submissions",
      value: stats?.total || 0,
      icon: <ListChecks className="h-4 w-4 text-blue-500" />,
      description: "All submissions",
      color: "border-l-4 border-l-blue-500",
    },
  ];

  console.log("submissions", submissions);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <SubmissionStats />
      {/* <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className={card.color}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div> */}

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
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
              submissions.map((submission: Submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.department_name}
                  </TableCell>
                  <TableCell>{submission.template_code}</TableCell>
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
