import { User } from "./auth";

// types/department.ts
export interface Department {
  id: number;
  name: string;
  code: string;
  hod?: User;
  faculty_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
