// types/template.ts
interface Criteria {
  id: number;
  number: number;
  name: string;
  description: string;
}

export interface Template {
  id: number;
  code: string; // e.g., "1.1.1", "1.2.1"
  name: string;
  board: string;
  // description?: string;
  criteria: Criteria; // e.g., "1.1", "1.2"
  // headers: string[];
  // columns: TemplateColumn[];
  metadata: [];
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
