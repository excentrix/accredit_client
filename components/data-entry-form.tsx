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
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface DataEntryFormProps {
  template: Template;
  onSuccess: () => void;
}

export function DataEntryForm({ template, onSuccess }: DataEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [query, setQuery] = useState<string>('');
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
      console.error('Error fetching autocomplete suggestions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
      if (query.length > 0) { // Fetch suggestions only if the input length is more than 1 character
          fetchSuggestions(query);
          console.log("query : ", query);
          console.log("suggestions : ", suggestions);
      } else {
          setSuggestions([]);
      }
  }, [query]);

  // Create a schema shape based on template columns
  const schemaShape: { [key: string]: z.ZodType<any, any> } = {};

  template.metadata.forEach((item: any) => {
    item.columns.forEach((column: any) => {
      let fieldSchema: z.ZodType<any, any>;

      switch (column.type) {
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

        case "select":
          fieldSchema = z.string().min(1, "Please select an option");
          break;

        case "textarea":
        case "string":
        default:
          fieldSchema = z.string().min(1, "This field is required");
          break;
      
      }

      // Make field optional if not required
      if (!column.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaShape[column.name] = fieldSchema;

    });
  });

  const formSchema = z.object(schemaShape);

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: template.metadata.reduce((acc: { [key: string]: string }, item: any) => {
      item.columns.forEach((column: any) => {
        acc[column.name] = ""; // Initialize each column name with an empty string
      });
      return acc;
    }, {}),
  });
  

  const onSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting values:", values); // Debug log

      const response = await api.post(`/templates/${template.code}/data/`, {
        data: values,
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

  const renderFormField = (column: Template["columns"][0]) => {
    const fieldProps = {
      label: column.display_name,
      name: column.name,
      required: column.required,
    };

    return (
      <FormField
        key={column.name}
        control={form.control}
        name={column.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {fieldProps.label}
              {fieldProps.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              {column.type === "select" ? (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${column.display_name.toLowerCase()}`}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {column.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : column.type === "textarea" ? (
                <Textarea
                  placeholder={`Enter ${column.display_name.toLowerCase()}`}
                  {...field}
                />
              ) : (
                <Input
                  type={
                    column.type === "number"
                      ? "number"
                      : column.type === "date"
                      ? "date"
                      : column.type === "email"
                      ? "email"
                      : "text"
                  }
                  placeholder={`Enter ${column.display_name.toLowerCase()}`}
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
            {/* <h3>
              <div style={{ position: 'relative', width: '300px' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a name..."
                  style={{ width: '100%', padding: '8px' }}
                />
                  {loading && <div>Loading...</div>}
                  {suggestions.length > 0 && (
                      <ul style={{ 
                          position: 'absolute', 
                          top: '40px', 
                          left: 0, 
                          width: '100%', 
                          border: '1px solid #ccc', 
                          backgroundColor: '#fff', 
                          listStyleType: 'none', 
                          padding: '0', 
                          margin: '0', 
                          zIndex: 1000 
                      }}>
                          {suggestions.map((name, index) => (
                              <li
                                  key={index}
                                  style={{
                                      padding: '8px',
                                      cursor: 'pointer'
                                  }}
                                  onClick={() => setQuery(name)} // Set the query to the selected suggestion
                              >
                                  {name}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
            </h3> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.metadata.flatMap((item: any) => item.columns).map((column: any) => 
                renderFormField(column)
              )}
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
