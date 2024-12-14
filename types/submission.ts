export interface SubmissionState {
  id: number | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  created_at?: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejection_reason?: string;
  is_empty: boolean;
  empty_reason?: string;
}
