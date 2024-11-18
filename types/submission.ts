export type SubmissionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface SubmissionState {
  id: number | null;
  status: SubmissionStatus;
  submitted_at?: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
}
