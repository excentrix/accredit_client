// types/dashboard.ts
export interface DashboardStats {
  total_submissions: number;
  pending_review: number;
  approved_submissions: number;
  rejected_submissions: number;
  completion_rate: number;
  departments_count: number;
  active_departments: number;
}

export interface ActivityTimelineData {
  date: string;
  submissions: number;
  approvals: number;
  rejections: number;
}

export interface CriteriaCompletion {
  criterion: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  template: string;
  department?: string;
  user: string;
  timestamp: string;
  status?: string;
}

export interface FacultyStats {
  total_submissions: number;
  pending_templates: number;
  approved_submissions: number;
  rejected_submissions: number;
  department_progress: number;
  recent_activity: RecentActivity[];
}
