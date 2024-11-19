import { useSubmission } from "@/context/submission-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function SubmissionStatus() {
  const {
    submissionState,
    isSubmitting,
    isLoading,
    submitTemplate,
    withdrawSubmission,
  } = useSubmission();

  console.log(submissionState?.status);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!submissionState) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Submission</AlertTitle>
            <AlertDescription>
              Start adding data to create your submission.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string | undefined | null) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "PPP 'at' p");
    } catch (error) {
      console.error("Invalid date:", error);
      return "Invalid date";
    }
  };

  const getStatusContent = () => {
    switch (submissionState.status) {
      case "draft":
        return {
          icon: <Clock className="h-5 w-5 text-blue-500" />,
          title: "Draft Mode",
          description: (
            <div className="space-y-2">
              <p>Your submission is currently in draft mode.</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Submission Status:</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Draft Mode - Currently Editing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                    <span>Pending Submission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                    <span>Awaiting Review</span>
                  </div>
                </div>
              </div>
            </div>
          ),
          alertVariant: "default" as const,
          buttonText: "Submit for Review",
          buttonAction: submitTemplate,
        };

      case "submitted":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          title: "Under Review",
          description: (
            <div className="space-y-2">
              <p>
                Your submission is currently under review by the IQAC Director.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">Submission Timeline:</p>
                <div className="grid grid-cols-1 gap-2">
                  {submissionState.created_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>
                        Created on {formatDate(submissionState.created_at)}
                      </span>
                    </div>
                  )}
                  {submissionState.submitted_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span>
                        Submitted for review on{" "}
                        {formatDate(submissionState.submitted_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-medium text-yellow-600">
                      Currently awaiting IQAC Director's review
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground italic">
                  You can withdraw your submission if you need to make changes.
                </p>
              </div>
            </div>
          ),
          alertVariant: "default" as const,
          buttonText: "Withdraw Submission",
          buttonAction: withdrawSubmission,
          buttonVariant: "outline" as const,
        };

      case "approved":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: "Submission Approved",
          description: (
            <div className="space-y-2">
              <p className="font-medium text-green-600">
                Your submission has been approved by the IQAC Director.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">Approval Timeline:</p>
                <div className="grid grid-cols-1 gap-2">
                  {submissionState.created_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>
                        Created on {formatDate(submissionState.created_at)}
                      </span>
                    </div>
                  )}
                  {submissionState.submitted_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>
                        Submitted on {formatDate(submissionState.submitted_at)}
                      </span>
                    </div>
                  )}
                  {submissionState.verified_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium text-green-600">
                        Approved by {submissionState.verified_by?.name} on{" "}
                        {formatDate(submissionState.verified_at)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-green-50 p-4 border border-green-100">
                  <p className="text-green-800">
                    This submission has been finalized and archived. No further
                    changes can be made.
                  </p>
                </div>
              </div>
            </div>
          ),
          alertVariant: "default" as const,
        };

      case "rejected":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          title: "Action Required: Submission Rejected",
          description: (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <p className="font-medium text-red-600">
                  Reason for Rejection:
                </p>
                <p className="mt-2 text-sm text-red-700">
                  {submissionState.rejection_reason || "No reason provided"}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Submission Timeline:</p>
                <div className="grid grid-cols-1 gap-2">
                  {submissionState.created_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>
                        Created on {formatDate(submissionState.created_at)}
                      </span>
                    </div>
                  )}
                  {submissionState.submitted_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span>
                        Submitted on {formatDate(submissionState.submitted_at)}
                      </span>
                    </div>
                  )}
                  {submissionState.verified_at && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-red-600">
                        Rejected by {submissionState.verified_by?.name} on{" "}
                        {formatDate(submissionState.verified_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTitle>Required Actions:</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Review the rejection feedback carefully</li>
                    <li>Make necessary corrections to your submission</li>
                    <li>Submit the revised version for another review</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          ),
          alertVariant: "destructive" as const,
          buttonText: "Submit Revised Version",
          buttonAction: submitTemplate,
        };

      default:
        return null;
    }
  };

  const statusContent = getStatusContent();
  if (!statusContent) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {statusContent.icon}
          <CardTitle>{statusContent.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={statusContent.alertVariant}>
          <AlertDescription>{statusContent.description}</AlertDescription>
        </Alert>

        {statusContent.buttonText && statusContent.buttonAction && (
          <div className="flex justify-end">
            <Button
              variant={statusContent.buttonVariant || "default"}
              onClick={statusContent.buttonAction}
              disabled={isSubmitting}
              className={cn(
                submissionState?.status === "rejected" &&
                  "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {statusContent.buttonText}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
