// types/template.ts
export interface Template {
  id: number;
  code: string; // e.g., "1.1.1", "1.2.1"
  name: string;
  description?: string;
  criteria: string; // e.g., "1.1", "1.2"
  headers: string[];
  columns: TemplateColumn[];
}

export interface TemplateColumn {
  name: string;
  display_name: string;
  type:
    | "string"
    | "number"
    | "text"
    | "url"
    | "date"
    | "email"
    | "select"
    | "textarea";
  required?: boolean;
}
