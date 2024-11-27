// config/validation.ts
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const templateSchema = z.object({
  code: z.string().min(1, "Template code is required"),
  name: z.string().min(1, "Template name is required"),
  board: z.string().min(1, "Board is required"),
  metadata: z.array(z.any()),
});

export const submissionSchema = z.object({
  template: z.string().min(1, "Template is required"),
  department: z.number().min(1, "Department is required"),
  academic_year: z.number().min(1, "Academic year is required"),
  data: z.array(z.any()),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type TemplateSchema = z.infer<typeof templateSchema>;
export type SubmissionSchema = z.infer<typeof submissionSchema>;
