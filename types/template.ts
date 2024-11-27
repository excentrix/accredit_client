import { User } from "./auth";

// types/template.ts
export interface Criteria {
  id: number;
  number: number;
  name: string;
  description: string;
  board: string;
}

// types/template.ts
export type DataType =
  | "string"
  | "number"
  | "email"
  | "date"
  | "url"
  | "select"
  | "textarea";

export interface TemplateColumn {
  name: string;
  type: "single" | "group";
  data_type: DataType;
  required: boolean;
  options?: string[]; // For select type data
  columns?: TemplateColumn[]; // For nested columns when type is 'group'
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface TemplateMetadataSection {
  headers: string[];
  columns: TemplateColumn[];
}

export interface Template {
  id: number;
  code: string;
  name: string;
  board: string;
  criteria: Criteria;
  metadata: TemplateMetadataSection[];
  created_at: string;
  updated_at: string;
  created_by?: User;
  updated_by?: User;
}

// For creating/updating templates
export interface TemplateSchema {
  code: string;
  name: string;
  board: string;
  criteria: number; // criteria ID
  metadata: TemplateMetadataSection[];
}

// Example type guard to check if a column is nested
export function isGroupColumn(
  column: TemplateColumn
): column is TemplateColumn & { type: "group"; columns: TemplateColumn[] } {
  return column.type === "group" && Array.isArray(column.columns);
}

// Helper type for the response data structure
export interface TemplateDataRow {
  id?: number;
  [key: string]: any;
}

export interface TemplateDataSection {
  section_index: number;
  rows: TemplateDataRow[];
}

// For saving template data
export interface TemplateSectionDataSchema {
  rows: TemplateDataRow[];
}
