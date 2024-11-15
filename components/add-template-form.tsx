// components/templates/add-template-form.tsx
"use client";

import { useState } from "react";
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
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoveVertical,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import api from "@/lib/api";

const templateSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[\d.]+$/, "Code must be in format like 1.1 or 1.1.1"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  headers: z.array(z.string()).min(1, "At least one header is required"),
  columns: z
    .array(
      z.object({
        name: z.string().min(1, "Field name is required"),
        display_name: z.string().min(1, "Display name is required"),
        type: z.string().min(1, "Field type is required"),
        required: z.boolean().default(false),
        description: z.string().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .min(1, "At least one column is required"),
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

interface Column {
  name: string;
  display_name: string;
  type: string;
  required: boolean;
  description?: string;
  options?: string[];
}

interface AddTemplateFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function AddTemplateForm({
  initialData,
  onSuccess,
}: AddTemplateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      description: "",
      headers: [""],
      columns: [
        {
          name: "",
          display_name: "",
          type: "string",
          required: false,
          description: "",
          options: [],
        },
      ],
    },
  });

  const columns: ColumnDef<Column>[] = [
    {
      id: "actions",
      size: 30,
      cell: ({ row }) => {
        const rowIndex = row.index;
        const totalRows = form.getValues("columns").length;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={rowIndex === 0}
              onClick={() => moveColumn(rowIndex, "up")}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={rowIndex === totalRows - 1}
              onClick={() => moveColumn(rowIndex, "down")}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <FormField
          control={form.control}
          name={`columns.${row.index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Field name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      ),
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: ({ row }) => (
        <FormField
          control={form.control}
          name={`columns.${row.index}.display_name`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Display name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <FormField
          control={form.control}
          name={`columns.${row.index}.type`}
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      ),
    },
    {
      accessorKey: "required",
      header: "Required",
      cell: ({ row }) => (
        <FormField
          control={form.control}
          name={`columns.${row.index}.required`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <FormField
          control={form.control}
          name={`columns.${row.index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Description" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      ),
    },
    {
      accessorKey: "options",
      header: "Options",
      cell: ({ row }) => {
        const type = form.watch(`columns.${row.index}.type`);
        if (type !== "select") return null;

        return (
          <FormField
            control={form.control}
            name={`columns.${row.index}.options`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Option1,Option2,..."
                    value={field.value?.join(",") || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );
      },
    },
    {
      id: "delete",
      size: 70,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeColumn(row.index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: form.watch("columns"),
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const moveColumn = (index: number, direction: "up" | "down") => {
    const columns = form.getValues("columns");
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    [newColumns[index], newColumns[newIndex]] = [
      newColumns[newIndex],
      newColumns[index],
    ];

    form.setValue("columns", newColumns);
  };

  const addHeader = () => {
    const currentHeaders = form.getValues("headers");
    form.setValue("headers", [...currentHeaders, ""]);
  };

  const removeHeader = (index: number) => {
    const currentHeaders = form.getValues("headers");
    form.setValue(
      "headers",
      currentHeaders.filter((_, i) => i !== index)
    );
  };

  const addColumn = () => {
    const currentColumns = form.getValues("columns");
    form.setValue("columns", [
      ...currentColumns,
      {
        name: "",
        display_name: "",
        type: "string",
        required: false,
        description: "",
        options: [],
      },
    ]);
  };

  const removeColumn = (index: number) => {
    const currentColumns = form.getValues("columns");
    form.setValue(
      "columns",
      currentColumns.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    try {
      setIsSubmitting(true);

      const cleanedColumns = values.columns.map((column) => ({
        ...column,
        options: column.type === "select" ? column.options : undefined,
      }));

      const data = {
        ...values,
        columns: cleanedColumns,
      };

      if (initialData) {
        await api.put(`/templates/${initialData.code}/`, data);
      } else {
        await api.post("/templates/", data);
      }

      toast({
        title: "Success",
        description: `Template ${
          initialData ? "updated" : "created"
        } successfully`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1.1.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter template name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter template description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Headers Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Headers *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHeader}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Header
            </Button>
          </div>
          {form.watch("headers").map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`headers.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={`Header ${index + 1}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHeader(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Columns Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Fields *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColumn}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No fields added
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : initialData
              ? "Update Template"
              : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
