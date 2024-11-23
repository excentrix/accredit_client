"use client";

import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";
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

function sanitizeColumnName(name: string): string {
  // For single word names, keep them as is
  if (!name.includes(" ")) return name;

  return name
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_]/g, "") // Remove special characters except underscores
    .replace(/_{2,}/g, "_"); // Replace multiple underscores with single
}

function getValidationSchema(column: any): z.ZodType<any, any> {
  let schema: z.ZodType<any, any>;

  switch (column.data_type) {
    case "number":
      schema = z.number().min(0, "Value must be 0 or greater").nullable();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshSectionData } = useTemplate();
  const { submissionState, isLoading, refreshSubmissionState } =
    useSubmission();

  const formSchema = useMemo(() => {
    const schemaShape: { [key: string]: z.ZodType<any, any> } = {};

    section.columns.forEach((column: any) => {
      if (column.type === "group") {
        column.columns.forEach((nestedColumn: any) => {
          const flatKey = `${column.name}_${nestedColumn.name}`;
          schemaShape[flatKey] = getValidationSchema(nestedColumn);
        });
      } else {
        // For single columns, use the name directly if it has no spaces
        const key = column.name.includes(" ")
          ? sanitizeColumnName(column.name)
          : column.name;
        schemaShape[key] = getValidationSchema(column);
      }
    });

    return z.object(schemaShape);
  }, [section]);

  const defaultValues = useMemo(() => {
    const values: { [key: string]: any } = {};

    section.columns.forEach((column: any) => {
      if (column.type === "group") {
        column.columns.forEach((nestedColumn: any) => {
          const flatKey = `${column.name}_${nestedColumn.name}`;
          values[flatKey] = nestedColumn.data_type === "number" ? null : "";
        });
      } else {
        // For single columns, use the name directly if it has no spaces
        const key = column.name.includes(" ")
          ? sanitizeColumnName(column.name)
          : column.name;
        values[key] = column.data_type === "number" ? null : "";
      }
    });

    return values;
  }, [section]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group("Form Debug");
      console.log("Section:", section);
      console.log("Form Schema:", formSchema);
      console.log("Default Values:", defaultValues);
      console.log("Current Form Values:", form.getValues());
      console.groupEnd();
    }
  }, [section, formSchema, defaultValues, form]);

  const onSubmit = async (values: any) => {
    if (!isEditable) {
      showToast.error("Cannot modify data in current submission status");
      return;
    }

    const loadingToast = showToast.loading("Saving data...");
    setIsSubmitting(true);

    try {
      // Flatten the nested data structure while preserving original column names
      const flattenedData = section.columns.reduce((acc: any, column: any) => {
        if (column.type === "group") {
          column.columns.forEach((nestedColumn: any) => {
            const flatKey = `${column.name}_${nestedColumn.name}`;
            acc[flatKey] = values[flatKey] ?? null;
          });
        } else {
          // Use original column name for single columns
          const key = column.name;
          acc[key] =
            values[
              column.name.includes(" ")
                ? sanitizeColumnName(column.name)
                : column.name
            ] ?? null;
        }
        return acc;
      }, {});

      if (process.env.NODE_ENV === "development") {
        console.log("Original values:", values);
        console.log("Flattened data for submission:", flattenedData);
      }

      const response = await api.post(
        `/templates/${template.code}/sections/${sectionIndex}/data/`,
        flattenedData
      );

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Data entry has been saved successfully");
        form.reset(defaultValues);
        await refreshSectionData(sectionIndex);
        await refreshSubmissionState();
        onSuccess?.();
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(error.response?.data?.message || "Failed to save data");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupFields = (column: any) => {
    const groupName = column.name; // Already sanitized in template

    return (
      <div key={groupName} className="space-y-4">
        <div className="font-medium text-sm text-muted-foreground">
          {column.display_name || column.name}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l">
          {column.columns.map((nestedColumn: any) => {
            const fieldName = `${groupName}_${nestedColumn.name}`;
            return (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {nestedColumn.display_name || nestedColumn.name}
                      {nestedColumn.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={
                          nestedColumn.data_type === "number"
                            ? "number"
                            : "text"
                        }
                        placeholder={`Enter ${
                          nestedColumn.display_name || nestedColumn.name
                        }`}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value =
                            nestedColumn.data_type === "number"
                              ? e.target.value === ""
                                ? null
                                : Number(e.target.value)
                              : e.target.value;
                          field.onChange(value);
                        }}
                        disabled={isSubmitting}
                        min={
                          nestedColumn.data_type === "number" ? 0 : undefined
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderFormField = (column: any) => {
    const fieldName = column.name.includes(" ")
      ? sanitizeColumnName(column.name)
      : column.name;
    const isFieldRequired = column.required;
    const fieldType = column.data_type;
    let placeholder = `Enter ${column.display_name || column.name}`;
    let description = column.description;

    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {column.display_name || column.name}
              {isFieldRequired && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              {fieldType === "option" ? ( // Changed from column.type === "option"
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
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value =
                      fieldType === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value;
                    field.onChange(value);
                  }}
                  disabled={isSubmitting}
                  min={fieldType === "number" ? 0 : undefined}
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {section.columns.map((column: any) =>
            column.type === "group"
              ? renderGroupFields(column)
              : renderFormField(column)
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Entry"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
