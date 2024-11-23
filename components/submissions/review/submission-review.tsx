import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  History,
  FileText,
  Calendar,
  User,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { SubmissionTimeline } from "./submission-timeline";
import { DiffViewer } from "./diff-viewer";

interface SubmissionReviewProps {
  submissionId: string;
}

export function SubmissionReview({ submissionId }: SubmissionReviewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("data");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isViewDataDialogOpen, setIsViewDataDialogOpen] = useState(false);

  const {
    data: submission,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: async () => {
      const response = await api.get(`/submissions/${submissionId}/`);
      return response.data;
    },
  });

  const handleApprove = async () => {
    try {
      await api.post(`/submissions/${submissionId}/approve/`);
      toast.success("Submission approved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to approve submission");
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/submissions/${submissionId}/reject/`, {
        reason: rejectionReason,
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      toast.success("Submission rejected successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to reject submission");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-300";
      case "submitted":
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300";
    }
  };

  function generateCSV(submission: any) {
    if (!submission.data_rows || submission.data_rows.length === 0) {
      return `Template: ${submission.template_name}
        Code: ${submission.template_code}
        Department: ${submission.department_name}
        Academic Year: ${submission.academic_year_name}

        No data available`;
    }

    // Get headers from the first row
    const headers = Object.keys(submission.data_rows[0].data);

    // Create CSV content
    const csvContent = [
      // Add template info as header
      [`Template: ${submission.template_name}`],
      //   [`Code: ${submission.template_code}`],
      //   [`Department: ${submission.department_name}`],
      //   [`Academic Year: ${submission.academic_year_name}`],
      [""], // Empty line for spacing
      headers, // Column headers
      // Add data rows
      ...submission.data_rows.map((row: any) =>
        headers.map((header) => row.data[header] ?? "")
      ),
    ]
      .map((row) =>
        row
          .map((cell: any) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    return csvContent;
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Submissions
      </Button>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg border ${getStatusColor(submission.status)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {submission.status === "approved" && (
              <CheckCircle className="h-5 w-5" />
            )}
            {submission.status === "rejected" && (
              <XCircle className="h-5 w-5" />
            )}
            {submission.status === "submitted" && (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
              Status:{" "}
              {submission.status.charAt(0).toUpperCase() +
                submission.status.slice(1)}
            </span>
          </div>
          {submission.status === "rejected" && (
            <div className="text-sm">Reason: {submission.rejection_reason}</div>
          )}
        </div>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">
            <FileText className="mr-2 h-4 w-4" />
            Submission Data
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{submission.template_name}</CardTitle>
              <CardDescription>
                Template Code: {submission.template_code}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="section-0" className="space-y-4">
                <TabsList className="w-full flex-wrap h-auto gap-2 p-2">
                  {[
                    ...new Set(
                      submission.data_rows.map((row) => row.section_index)
                    ),
                  ].map((sectionIndex) => {
                    const sectionData = submission.data_rows.filter(
                      (row) => row.section_index === sectionIndex
                    );

                    return (
                      <TabsTrigger
                        key={sectionIndex}
                        value={`section-${sectionIndex}`}
                        className="flex items-center gap-2"
                      >
                        <span>Section {sectionIndex + 1}</span>
                        <Badge variant="secondary" className="ml-2">
                          {sectionData.length} entries
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {[
                  ...new Set(
                    submission?.data_rows?.map((row) => row.section_index)
                  ),
                ].map((sectionIndex) => {
                  const sectionData = submission.data_rows.filter(
                    (row) => row.section_index === sectionIndex
                  );

                  return (
                    <TabsContent
                      key={sectionIndex}
                      value={`section-${sectionIndex}`}
                    >
                      <div className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Section {sectionIndex + 1} Data
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Showing {sectionData.length} entries
                            </p>
                          </div>

                          {sectionData.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle section data download
                                const csv = generateCSV(sectionData);
                                downloadCSV(
                                  csv,
                                  `${submission.template_code}_section${
                                    sectionIndex + 1
                                  }.csv`
                                );
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Section Data
                            </Button>
                          )}
                        </div>

                        {/* Section Data Table */}
                        {sectionData && sectionData.length > 0 ? (
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  {Object.keys(sectionData[0].data).map(
                                    (header) => (
                                      <TableHead
                                        key={header}
                                        className="whitespace-pre-wrap"
                                      >
                                        {header}
                                      </TableHead>
                                    )
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sectionData.map((row) => (
                                  <TableRow key={row.row_number}>
                                    {Object.values(row.data).map(
                                      (value, index) => (
                                        <TableCell
                                          key={index}
                                          className="whitespace-pre-wrap"
                                        >
                                          {String(value) ?? "—"}
                                        </TableCell>
                                      )
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/5">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              No Data Available
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              This section does not contain any data yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Department Information
                    </h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span>{" "}
                        {submission.department_name}
                      </p>
                      {/* Add more department details */}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Academic Year
                    </h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Year:</span>{" "}
                        {submission.academic_year_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Submission Timeline
                    </h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Submitted By:</span>{" "}
                        {submission.submitted_by_name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Submitted On:</span>{" "}
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                      {submission.verified_by && (
                        <>
                          <p className="text-sm">
                            <span className="font-medium">Verified By:</span>{" "}
                            {submission.verified_by}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Verified On:</span>{" "}
                            {new Date(submission.verified_at).toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
              <CardDescription>
                Track all changes and actions performed on this submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submission.history && submission.history.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <SubmissionTimeline
                    events={submission.history.map((event: any) => ({
                      id: event.id.toString(),
                      action: event.action,
                      performed_by_name: event.performed_by_name,
                      performed_at: event.performed_at,
                      details: event.details,
                      renderDetails: event.action === "updated" && (
                        <DiffViewer changes={event.details.changes} />
                      ),
                    }))}
                  />
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No history available for this submission
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsViewDataDialogOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Full Data
            </Button>
            {/* {submission.data_rows && submission.data_rows.length > 0 && ( */}
            <Button
              variant="outline"
              onClick={() => {
                const csv = generateCSV(submission);
                downloadCSV(
                  csv,
                  `${submission.template_code}_${submission.academic_year_name}.csv`
                );
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Data
            </Button>
            {/* )} */}
            <div className="flex-1" />
            <Button
              variant="destructive"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={submission.status !== "submitted"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={submission.status !== "submitted"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason}
            >
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Data Dialog */}
      <Dialog
        open={isViewDataDialogOpen}
        onOpenChange={setIsViewDataDialogOpen}
      >
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{submission.template_name}</DialogTitle>
            <DialogDescription>
              Template Code: {submission.template_code}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            {submission.data_rows && submission.data_rows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(submission.data_rows[0].data).map((header) => (
                      <TableHead key={header} className="whitespace-pre-wrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submission.data_rows.map((row: any) => (
                    <TableRow key={row.row_number}>
                      {Object.values(row.data).map((value, index) => (
                        <TableCell key={index} className="whitespace-pre-wrap">
                          {String(value) ?? "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Data Available
                </h3>
                <p className="text-muted-foreground text-sm">
                  This submission does not contain any data yet.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {submission.data_rows && submission.data_rows.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  // Handle download
                  const csv = generateCSV(submission);
                  downloadCSV(
                    csv,
                    `${submission.template_code}_${submission.academic_year_name}.csv`
                  );
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsViewDataDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
