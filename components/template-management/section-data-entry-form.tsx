// components/section-data-entry-form.tsx
"use client";

import { useState } from "react";
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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
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

interface SectionDataEntryFormProps {
  template: Template;
  section: any;
  sectionIndex: number;
  onSuccess: () => void;
}

export function SectionDataEntryForm({
  template,
  section,
  sectionIndex,
}: SectionDataEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshSectionData } = useTemplate();

  // Create schema for this section
  const schemaShape: { [key: string]: z.ZodType<any, any> } = {};

  section.columns.forEach((column: any) => {
    let fieldSchema: z.ZodType<any, any>;

    switch (column.data_type) {
      case "number":
        fieldSchema = z
          .string()
          .transform((val) => (val === "" ? undefined : Number(val)))
          .pipe(z.number().optional());
        break;
      case "date":
        fieldSchema = z.string().min(1, "Date is required");
        break;

      case "url":
        fieldSchema = z
          .string()
          .url("Must be a valid URL")
          .or(z.string().length(0));
        break;

      case "email":
        fieldSchema = z
          .string()
          .email("Must be a valid email")
          .or(z.string().length(0));
        break;

      case "option":
        fieldSchema = z.string().min(1, "Please select an option");
        break;

      case "string":
      default:
        fieldSchema = z.string().min(1, "This field is required");
        break;
    }

    if (!column.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaShape[column.name] = fieldSchema;
  });

  const formSchema = z.object(schemaShape);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: section.columns.reduce(
      (acc: { [key: string]: string }, column: any) => {
        acc[column.name] = "";
        return acc;
      },
      {}
    ),
  });

  const onSubmit = async (values: FormData) => {
    const loadingToast = showToast.loading("Saving data...");
    try {
      setIsSubmitting(true);

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
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(error.response?.data?.message || "Failed to save data");
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderFormField = (column: any) => {
    return (
      <FormField
        key={column.name}
        control={form.control}
        name={column.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {column.name}
              {column.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              {column.data_type === "option" ? (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
              ) : column.data_type === "textarea" ? (
                <Textarea placeholder={`Enter ${column.name}`} {...field} />
              ) : (
                <Input
                  type={
                    column.data_type === "number"
                      ? "number"
                      : column.data_type === "date"
                      ? "date"
                      : column.data_type === "email"
                      ? "email"
                      : "text"
                  }
                  placeholder={`Enter ${column.name}`}
                  {...field}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
