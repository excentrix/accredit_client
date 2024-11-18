// components/submission-list.tsx
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
import { Search } from "lucide-react";
import { formatDistance } from "date-fns";
import { showToast } from "@/lib/toast";
import api from "@/lib/api";
import { SubmissionReview } from "./submission-review";

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

export function SubmissionList() {
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get("/submissions/current_academic_year/");
      console.log(response);
      if (response.status === 200) {
        setSubmissions(response.data);
      }
    } catch (error) {
      showToast.error("Failed to fetch submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  console.log("sub", submissions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Current Submissions</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission: any) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.department_name}</TableCell>
                <TableCell>{submission.template_code}</TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      statusColors[
                        submission.status as keyof typeof statusColors
                      ]
                    }`}
                  >
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell>{submission.submitted_by_name}</TableCell>
                <TableCell>
                  {submission.submitted_at
                    ? formatDistance(
                        new Date(submission.submitted_at),
                        new Date(),
                        { addSuffix: true }
                      )
                    : "Not submitted"}
                </TableCell>
                <TableCell>
                  <SubmissionReview
                    templateCode={submission.template_code}
                    submission={submission}
                    departmentId={submission.department}
                    onReviewComplete={fetchSubmissions}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
