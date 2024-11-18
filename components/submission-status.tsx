import { useSubmission } from "@/context/submission-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export function SubmissionStatus() {
  const { submissionState, isSubmitting, submitTemplate, withdrawSubmission } =
    useSubmission();

  const getStatusDisplay = () => {
    switch (submissionState.status) {
      case "draft":
        return {
          icon: <Clock className="h-5 w-5" />,
          title: "Draft",
          description: "Your template data is in draft mode.",
          variant: "default" as const,
        };
      case "submitted":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Submitted",
          description:
            "Your template data has been submitted and is pending review.",
          variant: "warning" as const,
        };
      case "approved":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          title: "Approved",
          description: `Approved by ${
            submissionState.verified_by
          } on ${new Date(submissionState.verified_at!).toLocaleDateString()}`,
          variant: "success" as const,
        };
      case "rejected":
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: "Rejected",
          description: submissionState.rejection_reason,
          variant: "destructive" as const,
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  return (
    <div className="space-y-4">
      <Alert variant={statusDisplay.variant} className="space-y-2">
        <div className="flex items-center gap-2">
          {statusDisplay.icon}
          <AlertTitle>{statusDisplay.title}</AlertTitle>
        </div>
        <AlertDescription>{statusDisplay.description}</AlertDescription>
      </Alert>

      <div className="flex justify-end gap-2">
        {submissionState.status === "draft" && (
          <Button onClick={submitTemplate} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Review
          </Button>
        )}

        {submissionState.status === "submitted" && (
          <Button
            variant="outline"
            onClick={withdrawSubmission}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Withdraw Submission
          </Button>
        )}

        {submissionState.status === "rejected" && (
          <Button onClick={submitTemplate} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Again
          </Button>
        )}
      </div>
    </div>
  );
}
