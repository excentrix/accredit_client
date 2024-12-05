"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X, Trash2, Search, Filter, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { debounce } from "lodash";
import { Template } from "@/types/template";
import { showToast } from "@/lib/toast";
import { useTemplate } from "@/context/template-context";
import { useSubmission } from "@/context/submission-context";
import { useSettings } from "@/context/settings-context";

interface Column {
  name: string;
  type: "single" | "group";
  data_type?: string;
  required?: boolean;
  columns?: Column[];
}

interface TableHeader {
  id: string;
  label: string;
  colSpan: number;
  rowSpan: number;
  path: string[];
  data_type?: string;
}

interface FlattenedColumn {
  name: string;
  label: string;
  groupLabel?: string;
  originalName: string;
  data_type: string;
  path: string[];
  required?: boolean;
}

interface SectionDataTableProps {
  template: Template;
  section: any;
  sectionIndex: number;
}

function sanitizeColumnName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_{2,}/g, "_");
}

function flattenColumns(
  columns: Column[],
  parentPath: string[] = []
): FlattenedColumn[] {
  return columns.reduce((acc: FlattenedColumn[], column: Column) => {
    const sanitizedName = sanitizeColumnName(column.name);

    if (column.type === "group" && column.columns) {
      // For group columns, we only include the child columns
      return [
        ...acc,
        ...column.columns.map((nested) => ({
          name: `${sanitizedName}_${sanitizeColumnName(nested.name)}`,
          label: nested.name,
          groupLabel: column.name,
          originalName: nested.name,
          data_type: nested.data_type || "string",
          path: [sanitizedName, sanitizeColumnName(nested.name)],
          required: nested.required,
        })),
      ];
    }

    return [
      ...acc,
      {
        name: sanitizedName,
        label: column.name,
        groupLabel: parentPath[parentPath.length - 1],
        originalName: column.name,
        data_type: column.data_type || "string",
        path: [...parentPath, sanitizedName],
        required: column.required,
      },
    ];
  }, []);
}

function generateHeaders(
  columns: Column[],
  parentPath: string[] = []
): {
  headerRows: TableHeader[][];
  maxDepth: number;
} {
  let maxDepth = 0;
  const headerMap = new Map<number, TableHeader[]>();

  function processColumn(
    column: Column,
    depth: number = 0,
    path: string[] = []
  ): number {
    const sanitizedName = sanitizeColumnName(column.name);
    const currentPath = [...path, sanitizedName];

    // Ensure the row exists in the header map
    if (!headerMap.has(depth)) headerMap.set(depth, []);

    if (column.type === "group" && column.columns?.length) {
      // Calculate the total colSpan for the group by recursively processing its children
      const colSpan = column.columns.reduce(
        (sum, subColumn) => sum + processColumn(subColumn, depth + 1, currentPath),
        0
      );

      // Add the group header
      headerMap.get(depth)!.push({
        id: currentPath.join("_"),
        label: column.name,
        colSpan,
        rowSpan: 1, // Groups always span one row
        path: currentPath,
      });

      maxDepth = Math.max(maxDepth, depth + 1); // Update max depth
      return colSpan;
    } else {
      // Individual column header
      headerMap.get(depth)!.push({
        id: currentPath.join("_"),
        label: column.name,
        colSpan: 1,
        rowSpan: 1, // Temporary, adjusted below
        path: currentPath,
        data_type: column.data_type,
      });

      maxDepth = Math.max(maxDepth, depth + 1); // Update max depth
      return 1; // Single column contributes colSpan = 1
    }
  }

  // Process each top-level column
  columns.forEach((column) => processColumn(column));

  // Adjust rowSpan for individual headers
  headerMap.forEach((headers, depth) => {
    headers.forEach((header) => {
      if (!header.colSpan || header.colSpan === 1) {
        header.rowSpan = maxDepth - depth; // Individual columns span remaining rows
      }
    });
  });

  return {
    headerRows: Array.from(
      { length: maxDepth },
      (_, i) => headerMap.get(i) || []
    ),
    maxDepth,
  };
}

function getNestedValue(data: any, path: string[]): any {
  if (!data) return "";

  // For flattened data, construct the key
  const flattenedKey = path.join("_");
  if (data[flattenedKey] !== undefined) {
    return data[flattenedKey];
  }

  return "";
}

// Update setNestedValue function to handle flattened data
function setNestedValue(obj: any, path: string[], value: any): any {
  const newObj = { ...obj };
  const flattenedKey = path.join("_");
  newObj[flattenedKey] = value;
  return newObj;
}

export function SectionDataTable({
  template,
  section,
  sectionIndex,
}: SectionDataTableProps) {
  const {
    selectedBoard,
    selectedAcademicYear,
  } = useSettings();
  
  // Context values
  const { sectionData, refreshSectionData, isLoading } = useTemplate();
  const { submissionState } = useSubmission();

  const { headerRows, maxDepth } = useMemo(
    () => generateHeaders(section.columns),
    [section.columns]
  );

  const isEditable =
    submissionState?.status === "draft" ||
    submissionState?.status === "rejected";

  // Memoized flattened columns
  const flatColumns = useMemo(
    () => flattenColumns(section.columns),
    [section.columns]
  );

  // Local state
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    flatColumns.map((col) => col.name)
  );
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  // Search functionality with debounce
  const debouncedSearch = useCallback(
    debounce((query: string, columns: FlattenedColumn[], data: any[]) => {
      if (!query) {
        setFilteredData(data);
        return;
      }

      const lowercaseQuery = query.toLowerCase();
      const filtered = data.filter((row) => {
        return columns.some((col) => {
          const value = String(
            getNestedValue(row.data, col.path) || ""
          ).toLowerCase();
          return value.includes(lowercaseQuery);
        });
      });

      setFilteredData(filtered);
    }, 300),
    []
  );

  // Update filtered data when search or data changes
  useEffect(() => {
    const currentData = sectionData[sectionIndex] || [];

    // Flatten any nested data structure
    const cleanedData = currentData.map((row: any) => ({
      ...row,
      data: row.data?.data || row.data || {}, // Handle both nested and flat data
    }));

    debouncedSearch(searchQuery, flatColumns, cleanedData);
  }, [searchQuery, flatColumns, sectionData, sectionIndex]);

  // Initial data fetch
  useEffect(() => {
    refreshSectionData(sectionIndex);
  }, [sectionIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (editingRow !== null) {
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          handleSave(editingRow);
        } else if (e.key === "Escape") {
          handleCancel();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [editingRow, editedData]);

  // CRUD Operations
  const handleEdit = (rowIndex: number) => {
    const currentData = sectionData[sectionIndex] || [];
    // Get the data, handling both nested and flat structures
    const rowData =
      currentData[rowIndex]?.data?.data || currentData[rowIndex]?.data || {};
    setEditingRow(rowIndex);
    setEditedData(rowData);
  };

  const handleSave = async (rowIndex: number) => {
    const loadingToast = showToast.loading("Updating data...");
    try {
      const currentData = sectionData[sectionIndex] || [];

      // Send data without nesting
      const dataToSend = {
        data: editedData, // Send flat data structure
      };

      console.log("Saving data:", dataToSend); // Debug log

      const response = await api.put(
        `/templates/${template.code}/sections/${sectionIndex}/data/${currentData[rowIndex].id}/`,
        dataToSend, {
          params: {
            board: selectedBoard,
            academic_year: selectedAcademicYear,
          }
        }
      );

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Data updated successfully");
        await refreshSectionData(sectionIndex);
        setEditingRow(null);
        setEditedData(null);
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(error.response?.data?.message || "Failed to update data");
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const handleDelete = async (rowIndex: number) => {
    const loadingToast = showToast.loading("Deleting data...");
    try {
      const currentData = sectionData[sectionIndex] || [];
      const response = await api.delete(
        `/templates/${template.code}/sections/${sectionIndex}/data/${currentData[rowIndex].id}/`, {
          params: {
            board: selectedBoard,
            academic_year: selectedAcademicYear,
          }
        }
      );

      if (response.data.status === "success") {
        showToast.dismiss(loadingToast);
        showToast.success("Data deleted successfully");
        await refreshSectionData(sectionIndex);
        setShowDeleteDialog(false);
        setRowToDelete(null);
      }
    } catch (error: any) {
      showToast.dismiss(loadingToast);
      showToast.error(error.response?.data?.message || "Failed to delete data");
    }
  };

  const renderCell = (
    row: any,
    column: FlattenedColumn,
    rowIndex: number,
    colIndex: number
  ) => {
    if (process.env.NODE_ENV === "development") {
      console.log("Cell debug:", {
        column: column.name,
        path: column.path,
        flattenedKey: column.path.join("_"),
        rowData: row.data,
        value: getNestedValue(row.data, column.path),
      });
    }

    if (editingRow === rowIndex) {
      const currentValue = getNestedValue(editedData, column.path);
      return (
        <Input
          value={currentValue?.toString() ?? ""} // Convert to string or use empty string
          onChange={(e) => {
            let value: string | number | null = e.target.value;
            if (column.data_type === "number") {
              value = e.target.value === "" ? null : Number(e.target.value);
            }
            const newData = setNestedValue(editedData, column.path, value);
            setEditedData(newData);
          }}
          className="h-8"
          autoFocus={colIndex === 0}
          type={column.data_type === "number" ? "number" : "text"}
          required={column.required}
          min={column.data_type === "number" ? 0 : undefined}
        />
      );
    }

    const value = getNestedValue(row.data, column.path);
    if (value === undefined || value === null || value === "") return "-";

    if (column.data_type === "number") {
      return typeof value === "number" ? value.toLocaleString() : value;
    }
    return value;
  };

  // Render loading state
  if (isLoading[sectionIndex]) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            {flatColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.name}
                checked={selectedColumns.includes(column.name)}
                onCheckedChange={(checked) => {
                  setSelectedColumns(
                    checked
                      ? [...selectedColumns, column.name]
                      : selectedColumns.filter((col) => col !== column.name)
                  );
                }}
              >
                {column.groupLabel
                  ? `${column.groupLabel} › ${column.label}`
                  : column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {headerRows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="bg-muted/50">
                {rowIndex === 0 && (
                  <TableHead rowSpan={headerRows.length} style={{ width: 100 }}>
                    Action
                  </TableHead>
                )}
                {row.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    rowSpan={header.rowSpan}
                    className="text-center border-r last:border-r-0"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{header.label}</div>
                      {header.data_type && (
                        <div className="text-xs text-muted-foreground">
                          {header.data_type}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={flatColumns.length + 1}
                  className="text-center h-32 text-muted-foreground"
                >
                  {searchQuery
                    ? "No matching results found."
                    : "No entries found. Add some data to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    editingRow === rowIndex && "bg-muted/50",
                    "hover:bg-muted/30 transition-colors"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingRow === rowIndex ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSave(rowIndex)}
                            disabled={!isEditable}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            disabled={!isEditable}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rowIndex)}
                            disabled={!isEditable}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRowToDelete(rowIndex);
                              setShowDeleteDialog(true);
                            }}
                            disabled={!isEditable}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  {flatColumns.map((column, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className="border-r last:border-r-0"
                    >
                      {renderCell(row, column, rowIndex, colIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              data entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (rowToDelete !== null) {
                  handleDelete(rowToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
