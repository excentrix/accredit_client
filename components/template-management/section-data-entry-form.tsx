// components/section-data-entry-form.tsx
"use client";

import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import api from "@/lib/api";
import { Template } from "@/types/template";
import { useTemplate } from "@/context/template-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { showToast } from "@/lib/toast";
import { useSubmission } from "@/context/submission-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SectionDataEntryFormProps {
  template: Template;
  section: any;
  sectionIndex: number;
  onSuccess?: () => void;
}

// Helper function for validation schema
function getValidationSchema(column: any): z.ZodType<any, any> {
  let schema: z.ZodType<any, any>;

  switch (column.data_type) {
    case "number":
      schema = z
        .string()
        .transform((val) => (val === "" ? undefined : Number(val)))
        .pipe(z.number().optional());
      break;

    case "date":
      schema = z.string().min(1, "Date is required");
      break;

    case "url":
      schema = z.string().url("Must be a valid URL").or(z.string().length(0));
      break;

    case "email":
      schema = z
        .string()
        .email("Must be a valid email")
        .or(z.string().length(0));
      break;

    case "option":
      schema = z.string().min(1, "Please select an option");
      break;

    case "textarea":
      schema = z.string().min(1, "This field is required");
      break;

    case "string":
    default:
      schema = z.string().min(1, "This field is required");
      break;
  }

  return column.required ? schema : schema.optional();
}

export function SectionDataEntryForm({
  template,
  section,
  sectionIndex,
  onSuccess,
}: SectionDataEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshSectionData } = useTemplate();
  const { submissionState, isLoading } = useSubmission();

  // Create form schema using useMemo
  const formSchema = useMemo(() => {
    const schemaShape: { [key: string]: z.ZodType<any, any> } = {};

    section.columns.forEach((column: any) => {
      if (column.type === "single") {
        schemaShape[column.name] = getValidationSchema(column);
      } else if (column.type === "group") {
        column.columns.forEach((nestedColumn: any) => {
          const fieldName = `${column.name}_${nestedColumn.name}`;
          schemaShape[fieldName] = getValidationSchema(nestedColumn);
        });
      }
    });

    return z.object(schemaShape);
  }, [section]);

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: section.columns.reduce(
      (acc: { [key: string]: string }, column: any) => {
        if (column.type === "single") {
          acc[column.name] = "";
        } else if (column.type === "group") {
          column.columns.forEach((nestedColumn: any) => {
            acc[`${column.name}_${nestedColumn.name}`] = "";
          });
        }
        return acc;
      },
      {}
    ),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const isEditable = submissionState
    ? submissionState.status === "draft" ||
      submissionState.status === "rejected"
    : true;

  const onSubmit = async (values: FormData) => {
    if (!isEditable) {
      showToast.error("Cannot modify data in current submission status");
      return;
    }

    const loadingToast = showToast.loading("Saving data...");
    setIsSubmitting(true);

    try {
      const response = await api.post(
        `/templates/${template.code}/sections/${sectionIndex}/data/`,
        values
      );

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Data entry has been saved successfully");
        form.reset();
        setIsOpen(false);
        await refreshSectionData(sectionIndex);
        onSuccess?.();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(error.response?.data?.message || "Failed to save data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (column: any) => {
    const isFieldRequired = column.required;
    let fieldType = column.data_type;
    let placeholder = `Enter ${column.name}`;
    let description = column.description;

    return (
      <FormField
        key={column.name}
        control={form.control}
        name={column.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {column.name}
              {isFieldRequired && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              {fieldType === "option" ? (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${column.name}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {column.options?.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : fieldType === "textarea" ? (
                <Textarea
                  placeholder={placeholder}
                  {...field}
                  disabled={isSubmitting}
                />
              ) : (
                <Input
                  type={
                    fieldType === "number"
                      ? "number"
                      : fieldType === "date"
                      ? "date"
                      : fieldType === "email"
                      ? "email"
                      : "text"
                  }
                  placeholder={placeholder}
                  {...field}
                  disabled={isSubmitting}
                />
              )}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (!isEditable) {
    return (
      <Alert>
        <AlertTitle>Read Only</AlertTitle>
        <AlertDescription>
          This submission cannot be modified in its current status.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Entry - {section.headers[0]}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.columns.map((column: any) => renderFormField(column))}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
