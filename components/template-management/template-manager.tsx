// components/data-management/template-manager.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileDown, FileUp } from "lucide-react";

import { Template } from "@/types/template";

import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/templates/");
      setTemplates(response.data);
    } catch (error) {
      showToast.error("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (template: Template) => {
    router.push(`/dashboard/template-management/edit?code=${template.code}`);
  };

  const handleDelete = async (template: Template) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await api.delete(`/templates/${template.code}/`);
      showToast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      showToast.error("Failed to delete template");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-muted-foreground">
            Manage data collection templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => router.push("/dashboard/template-management/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              {/* <TableHead>Description</TableHead> */}
              <TableHead>Sections</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No templates found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.code}</TableCell>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>
                    {template.metadata.map((item: any, index: number) => (
                      <div key={index} className="mb-4">
                        {/* Display Section Info */}
                        <div className="font-semibold mb-2 text-primary">
                          Section {index + 1}
                        </div>

                        {/* Display Headers */}
                        {item.headers && item.headers.length > 0 && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Headers:</strong>
                            <ul className="list-disc pl-5">
                              {item.headers.map(
                                (header: string, headerIndex: number) => (
                                  <li
                                    key={headerIndex}
                                    className="truncate text-sm text-gray-800"
                                  >
                                    {header}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Display Columns */}
                        {item.columns && item.columns.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Columns:</strong>
                            <ul className="list-disc pl-5">
                              {item.columns.map(
                                (column: any, columnIndex: number) => (
                                  <li
                                    key={columnIndex}
                                    className="flex justify-between"
                                  >
                                    <span className="truncate">
                                      {column.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-400">
                                      ({column.data_type})
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
