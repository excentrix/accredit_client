import { User } from "./auth";
import { Department } from "./department";
import { Template } from "./template";

// types/submission.ts
export interface SubmissionState {
  id: number | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  template: Template;
  department: Department;
  academic_year: string;
  created_at?: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejection_reason?: string;
  data?: Record<string, any>[];
  comments?: SubmissionComment[];
}

export interface SubmissionComment {
  id: number;
  submission: number;
  user: User;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  by_department: {
    department: string;
    count: number;
    status: Record<SubmissionState["status"], number>;
  }[];
}

export interface DepartmentBreakdown {
  department: Department;
  total_submissions: number;
  status_counts: Record<SubmissionState["status"], number>;
  completion_rate: number;
}

export interface SubmissionSchema {
  template: string; // template code
  department: number; // department ID
  academic_year: string;
  data?: Record<string, any>[]; // Optional for draft submissions
}

export interface SubmissionUpdateSchema {
  data?: Record<string, any>[];
  status?: "draft" | "submitted";
}

export interface SubmissionFilterSchema {
  template?: string;
  department?: number;
  academic_year?: string;
  status?: SubmissionState["status"];
  verified_by?: number;
  created_at_after?: string;
  created_at_before?: string;
  submitted_at_after?: string;
  submitted_at_before?: string;
}

export interface SubmissionCommentSchema {
  comment: string;
}

export interface SubmissionRejectionSchema {
  reason: string;
}
