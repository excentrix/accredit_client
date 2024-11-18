// components/data-entry-form.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Template } from "@/types/template";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Label } from "./ui/label";

interface DataEntryFormProps {
  template: Template;
  onSuccess: () => void;
}

export function DataEntryForm({ template, onSuccess }: DataEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSuggestions = async (input: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/autocomplete/?q=${input}`);
      if (response.status === 200) {
        console.log("respopse$$$$: ", response);
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (query.length > 0) {
      // Fetch suggestions only if the input length is more than 1 character
      fetchSuggestions(query);
      console.log("query : ", query);
      console.log("suggestions : ", suggestions);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Create a schema shape based on template columns
  const schemaShape: { [key: string]: z.ZodType<any, any> } = {};

  template.metadata.forEach((section, sectionIndex) => {
    section.columns.forEach((column: any) => {
      let fieldSchema: z.ZodType<any, any>;

      // Determine the schema based on data_type instead of type
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

      // Make field optional if not required
      if (!column.required) {
        fieldSchema = fieldSchema.optional();
      }

      // Use the exact column name as the key
      schemaShape[column.name] = fieldSchema;
      const fieldName = `${sectionIndex}_${column.name}`;
      schemaShape[fieldName] = fieldSchema;
    });
  });

  const formSchema = z.object(schemaShape);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: template.metadata.reduce(
      (acc: { [key: string]: string }, section, sectionIndex) => {
        section?.columns.forEach((column: any) => {
          acc[`${sectionIndex}_${column.name}`] = "";
        });
        return acc;
      },
      {}
    ),
  });

  const onSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);

      // Transform the form data back into sections
      const sectionData = template.metadata.map((section, sectionIndex) => {
        const sectionValues: { [key: string]: any } = {};
        section.columns.forEach((column: any) => {
          const fieldName = `${sectionIndex}_${column.name}`;
          sectionValues[column.name] = values[fieldName];
        });
        return sectionValues;
      });

      const response = await api.post(`/templates/${template.code}/data/`, {
        sections: sectionData,
      });

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Data entry has been saved successfully.",
        });
        form.reset();
        setIsOpen(false);
        onSuccess();
      } else {
        throw new Error(response.data.message || "Failed to save data");
      }
    } catch (error) {
      console.error("Failed to save data:", error);
      toast({
        title: "Error",
        description: "Failed to save data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (column: any, sectionIndex: number) => {
    return (
      <FormField
        key={`${sectionIndex}_${column.name}`}
        control={form.control}
        name={`${sectionIndex}_${column.name}`}
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
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {template.metadata.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <h3 className="font-semibold text-lg">{section.headers[0]}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.columns.map((column: any) =>
                    renderFormField(column, sectionIndex)
                  )}
                </div>
              </div>
            ))}
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
