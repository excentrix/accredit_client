"use client";

import { memo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { showToast } from "@/lib/toast";

// Interfaces
interface AddTemplateFormProps {
  initialData?: any;
  onSuccess: () => void;
}

interface Criteria {
  id: number;
  number: number;
  name: string;
  description?: string;
}

// Constants
const COLUMN_TYPES = [
  { value: "single", label: "Single Field" },
  { value: "group", label: "Column Group" },
];

const DATA_TYPES = [
  {
    value: "string",
    label: "Text",
    description: "Single line text input",
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric values only",
  },
  {
    value: "date",
    label: "Date",
    description: "Date picker",
  },
  {
    value: "option",
    label: "Select",
    description: "Dropdown selection",
  },
  {
    value: "email",
    label: "Email",
    description: "Email address",
  },
  {
    value: "url",
    label: "URL",
    description: "Web URL",
  },
];

// Schemas
const columnSchema: z.ZodSchema<any> = z
  .object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(["single", "group"]),
    data_type: z.string().optional(),
    required: z.boolean().default(true),
    options: z.array(z.string()).optional(),
    columns: z.array(z.lazy(() => columnSchema)).optional(),
    validation: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "single") {
        if (!data.data_type) return false;
        if (
          data.data_type === "option" &&
          (!data.options || data.options.length === 0)
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Invalid column configuration",
      path: ["data_type"],
    }
  );

const templateSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[\d.]+$/, "Code must be in format like 1.1 or 1.1.1"),
  name: z.string().min(1, "Name is required"),
  criteria: z.number().min(1, "Criteria is required"),
  metadata: z.array(
    z.object({
      headers: z.array(z.string().min(1, "Header is required")),
      columns: z.array(columnSchema),
    })
  ),
});

// Options Field Component
const OptionsField = ({
  options = [],
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) => {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (newOption.trim()) {
      onChange([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add new option..."
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addOption}>
          Add
        </Button>
      </div>

      {options.length > 0 && (
        <div className="border rounded-md p-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-sm"
            >
              <span>{option}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Column Field Component
const ColumnField = ({
  sectionIndex,
  columnIndex,
  parentPath = "",
  onRemove,
  form,
  depth = 0,
}: {
  sectionIndex: number;
  columnIndex: number;
  parentPath?: string;
  onRemove: () => void;
  form: any;
  depth?: number;
}) => {
  const path = parentPath
    ? `${parentPath}.columns.${columnIndex}`
    : `metadata.${sectionIndex}.columns.${columnIndex}`;

  const columnType = form.watch(`${path}.type`);
  const dataType = form.watch(`${path}.data_type`);

  return (
    <div
      className="border rounded-md p-4 mb-2"
      style={{ marginLeft: `${depth * 20}px` }}
    >
      <div className="flex items-center gap-4 mb-4">
        <FormField
          control={form.control}
          name={`${path}.name`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Column Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${path}.type`}
          render={({ field }) => (
            <FormItem className="w-[200px]">
              <div className="flex items-center gap-1">
                <FormLabel>Type</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose between a single field or a group of fields</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "group") {
                      form.setValue(`${path}.columns`, []);
                      form.setValue(`${path}.data_type`, undefined);
                    } else {
                      form.setValue(`${path}.data_type`, "string");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {columnType === "single" && (
          <FormField
            control={form.control}
            name={`${path}.data_type`}
            render={({ field }) => (
              <FormItem className="w-[200px]">
                <div className="flex items-center gap-1">
                  <FormLabel>Data Type</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {DATA_TYPES.find((t) => t.value === field.value)
                            ?.description ||
                            "Select the type of data for this field"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== "option") {
                        form.setValue(`${path}.options`, undefined);
                      } else {
                        form.setValue(`${path}.options`, []);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`${path}.required`}
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 pt-6">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="mt-0">Required</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="mt-6"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation Options */}
      {columnType === "single" && (
        <div className="mt-4">
          {dataType === "number" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`${path}.validation.min`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${path}.validation.max`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {dataType === "string" && (
            <FormField
              control={form.control}
              name={`${path}.validation.pattern`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern (RegEx)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., ^[A-Za-z]+$" />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {dataType === "option" && (
            <FormField
              control={form.control}
              name={`${path}.options`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Options</FormLabel>
                  <FormControl>
                    <OptionsField
                      options={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {columnType === "group" && (
        <div className="pl-4 border-l-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Nested Columns</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentColumns = form.getValues(`${path}.columns`) || [];
                form.setValue(`${path}.columns`, [
                  ...currentColumns,
                  {
                    name: "",
                    type: "single",
                    data_type: "string",
                    required: false,
                  },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Nested Column
            </Button>
          </div>
          {form.watch(`${path}.columns`)?.map((_: any, nestedIndex: number) => (
            <ColumnField
              key={nestedIndex}
              sectionIndex={sectionIndex}
              columnIndex={nestedIndex}
              parentPath={path}
              depth={depth + 1}
              form={form}
              onRemove={() => {
                const currentColumns = form.getValues(`${path}.columns`);
                currentColumns.splice(nestedIndex, 1);
                form.setValue(`${path}.columns`, currentColumns);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function AddTemplateForm({
  initialData,
  onSuccess,
}: AddTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: criteria, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const response = await api.get("/criteria/list/");
      return response.data;
    },
  });

  const validateCode = (code: string, criteriaNumber: number) => {
    if (!code.startsWith(`${criteriaNumber}.`)) {
      return "Code must start with the selected criteria number";
    }
    return true;
  };

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      criteria: undefined,
      metadata: [
        {
          headers: [""],
          columns: [
            {
              name: "",
              type: "single",
              data_type: "string",
              required: true,
              validation: {},
            },
          ],
        },
      ],
    },
  });

  const addSection = () => {
    const currentSections = form.getValues("metadata");
    form.setValue("metadata", [
      ...currentSections,
      {
        headers: [""],
        columns: [
          {
            name: "",
            type: "single",
            data_type: "string",
            required: true,
            validation: {},
          },
        ],
      },
    ]);
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
      type: "single",
      data_type: "string",
      required: true,
      validation: {},
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

      // Validate code format
      const selectedCriteria = criteria?.find(
        (c: Criteria) => c.id === values.criteria
      );
      if (selectedCriteria) {
        const validation = validateCode(values.code, selectedCriteria.number);
        if (typeof validation === "string") {
          form.setError("code", {
            type: "manual",
            message: validation,
          });
          return;
        }
      }

      if (initialData) {
        await api.put(`/templates/${initialData.code}/`, data);
        showToast.success("Template updated successfully");
      } else {
        await api.post("/templates/", data);
        showToast.success("Template created successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Template submission error:", error);
      showToast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCriteria) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading criteria...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen py-5 ">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 h-screen"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Criteria *</FormLabel>
                  <Select
                    disabled={isLoadingCriteria || isSubmitting}
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      const selectedCriteria = criteria?.find(
                        (c: Criteria) => c.id === parseInt(value)
                      );
                      if (selectedCriteria) {
                        const currentCode = form.getValues("code");
                        if (!currentCode) {
                          form.setValue("code", `${selectedCriteria.number}.`);
                        }
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select criteria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {criteria?.map((criterion: Criteria) => (
                        <SelectItem
                          key={criterion.id}
                          value={criterion.id.toString()}
                        >
                          Criterion {criterion.number}: {criterion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1.1.1"
                      disabled={isSubmitting}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const criteriaId = form.getValues("criteria");
                        const selectedCriteria = criteria?.find(
                          (c: Criteria) => c.id === criteriaId
                        );
                        if (selectedCriteria) {
                          const validation = validateCode(
                            e.target.value,
                            selectedCriteria.number
                          );
                          if (typeof validation === "string") {
                            form.setError("code", {
                              type: "manual",
                              message: validation,
                            });
                          } else {
                            form.clearErrors("code");
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter template name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Sections *</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSection}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Section
              </Button>
            </div>

            {form.watch("metadata")?.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border p-4 rounded-md mb-2">
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Section {sectionIndex + 1}</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(sectionIndex)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {section.headers.map((header, headerIndex) => (
                  <div
                    key={headerIndex}
                    className="flex items-center gap-2 mb-2"
                  >
                    <FormField
                      control={form.control}
                      name={`metadata.${sectionIndex}.headers.${headerIndex}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder={`Header ${headerIndex + 1}`}
                              disabled={isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(sectionIndex, headerIndex)}
                      disabled={isSubmitting || section.headers.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addHeader(sectionIndex)}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Header
                </Button>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Columns</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addColumn(sectionIndex)}
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Column
                    </Button>
                  </div>
                  {section.columns.map((column, columnIndex) => (
                    <ColumnField
                      key={columnIndex}
                      sectionIndex={sectionIndex}
                      columnIndex={columnIndex}
                      form={form}
                      onRemove={() => removeColumn(sectionIndex, columnIndex)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addColumn(sectionIndex)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Column
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {initialData ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{initialData ? "Update Template" : "Create Template"}</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
