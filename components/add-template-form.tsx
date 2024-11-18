
"use client";

import { memo, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const templateSchema = z.object({
  code: z.string().min(1, "Code is required").regex(/^[\d.]+$/, "Code must be in format like 1.1 or 1.1.1"),
  name: z.string().min(1, "Name is required"),
  metadata: z.array(
    z.object({
      headers: z.array(z.string().min(1, "Header is required")),
      columns: z.array(
        z.object({
          name: z.string().min(1, "Field name is required"),
          type: z.string().min(1, "Field type is required"),
          data_type: z.string().min(1, "Field type is required"),
          required: z.boolean().default(false),
          options: z.array(z.string()).optional(),
        })
      ),
    })
  ),
});

const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "textarea", label: "Text Area" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
];

interface AddTemplateFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function AddTemplateForm({ initialData, onSuccess }: AddTemplateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      metadata: [{ headers: [""], columns: [{ name: "", type: "string", data_type: "string", required: false, options: [] }] }],
    },
  });

  const MemoizedInput = memo(({ value, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <Input value={value} onChange={onChange} {...props} />
  ));

  const MemoizedSelect = ({ value, onValueChange, children, ...props }: any) => (
    <Select value={value} onValueChange={onValueChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Select a field type" />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
  

  const MemoizedCheckbox = memo(({ checked, onCheckedChange, ...props }: any) => (
    <Checkbox checked={checked} onCheckedChange={onCheckedChange} {...props} />
  ));

  const addSection = () => {
    const currentSections = form.getValues("metadata");
    form.setValue("metadata", [...currentSections, { headers: [""], columns: [] }]);
  };

  const removeSection = (sectionIndex: number) => {
    const currentSections = form.getValues("metadata");
    currentSections.splice(sectionIndex, 1);
    form.setValue("metadata", currentSections);
  };

  const addHeader = (sectionIndex: number) => {
    const currentSections = form.getValues("metadata");
    currentSections[sectionIndex].headers.push("");
    form.setValue("metadata", currentSections);
  };

  const removeHeader = (sectionIndex: number, headerIndex: number) => {
    const currentSections = form.getValues("metadata");
    currentSections[sectionIndex].headers.splice(headerIndex, 1);
    form.setValue("metadata", currentSections);
  };

  const addColumn = (sectionIndex: number) => {
    const currentSections = form.getValues("metadata");
    currentSections[sectionIndex].columns.push({
      name: "",
      type: "string",
      data_type: "string",
      required: false,
      options: [],
    });
    form.setValue("metadata", currentSections);
  };

  const removeColumn = (sectionIndex: number, columnIndex: number) => {
    const currentSections = form.getValues("metadata");
    currentSections[sectionIndex].columns.splice(columnIndex, 1);
    form.setValue("metadata", currentSections);
  };

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    try {
      setIsSubmitting(true);
      const data = { ...values };

      if (initialData) {
        await api.put(`/templates/${initialData.code}/`, data);
      } else {
        await api.post("/templates/", data);
      }

      toast({ title: "Success", description: `Template ${initialData ? "updated" : "created"} successfully` });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Template Code *</FormLabel>
              <FormControl><MemoizedInput placeholder="e.g., 1.1.1" {...field} /></FormControl>
              <FormMessage /> 
            </FormItem>
          )} />

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name *</FormLabel>
              <FormControl><MemoizedInput placeholder="Enter template name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Sections Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Sections *</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" /> Add Section
            </Button>
          </div>

          {form.watch("metadata")?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border p-4 rounded-md mb-2">
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Section {sectionIndex + 1}</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(sectionIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Headers */}
              {section.headers.map((header, headerIndex) => (
                <div key={headerIndex} className="flex items-center gap-2 mb-2">
                  <FormField control={form.control} name={`metadata.${sectionIndex}.headers.${headerIndex}`} render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input placeholder={`Header ${headerIndex + 1}`} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeHeader(sectionIndex, headerIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addHeader(sectionIndex)}>
                <Plus className="h-4 w-4 mr-2" /> Add Header
              </Button>

              {/* Columns */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Columns</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => addColumn(sectionIndex)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Column
                  </Button>
                </div>
                {section.columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex items-center gap-4 mb-2">
                    <FormField control={form.control} name={`metadata.${sectionIndex}.columns.${columnIndex}.name`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input placeholder="Column Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={`metadata.${sectionIndex}.columns.${columnIndex}.type`} render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MemoizedSelect {...field}>
                            {FIELD_TYPES.map((fieldType) => (
                              <SelectItem key={fieldType.value} value={fieldType.value}>
                                {fieldType.label}
                              </SelectItem>
                            ))}
                          </MemoizedSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={`metadata.${sectionIndex}.columns.${columnIndex}.required`} render={({ field }) => (
                      <FormItem>
                        <FormControl><MemoizedCheckbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="button" variant="ghost" size="sm" onClick={() => removeColumn(sectionIndex, columnIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">Save Template</Button>
      </form>
    </Form>
  );
}
