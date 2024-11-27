import { User } from "./auth";

// types/common.ts
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface AuditedModel extends BaseModel {
  created_by?: User;
  updated_by?: User;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: any;
}
