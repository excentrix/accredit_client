// components/submission-review.tsx
"use client";

import { useState } from "react";
import { Template } from "@/types/template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { showToast } from "@/lib/toast";
import api from "@/lib/api";

interface SubmissionReviewProps {
  templateCode: Template["code"];
  submission: any; // Replace with proper type
  departmentId: string;
  onReviewComplete: () => void;
}

export function SubmissionReview({
  templateCode,
  submission,
  departmentId,
  onReviewComplete,
}: SubmissionReviewProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    const loadingToast = showToast.loading("Approving submission...");

    try {
      const response = await api.post(`/templates/${templateCode}/approve/`, {
        department: departmentId,
      });

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Submission approved successfully");
        onReviewComplete();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(
        error.response?.data?.message || "Failed to approve submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = showToast.loading("Rejecting submission...");

    try {
      const response = await api.post(`/templates/${templateCode}/reject/`, {
        department: departmentId,
        reason: rejectionReason,
      });

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Submission rejected successfully");
        setIsRejectDialogOpen(false);
        setRejectionReason("");
        onReviewComplete();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(
        error.response?.data?.message || "Failed to reject submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button
          onClick={handleApprove}
          disabled={isSubmitting || submission.status !== "submitted"}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Approve
        </Button>

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isSubmitting || submission.status !== "submitted"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
