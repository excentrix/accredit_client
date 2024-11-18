// components/section-data-table.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
import { useTemplate } from "@/context/template-context";

interface SectionDataTableProps {
  template: Template;
  section: any;
  sectionIndex: number;
}

export function SectionDataTable({
  template,
  section,
  sectionIndex,
}: SectionDataTableProps) {
  // Get context values
  const { sectionData, refreshSectionData, isLoading } = useTemplate();

  // Local state
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    section.columns.map((col: any) => col.name)
  );
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  const { toast } = useToast();

  // Search functionality with debounce
  const debouncedSearch = useCallback(
    debounce((query: string, columns: string[], data: any[]) => {
      if (!query) {
        setFilteredData(data);
        return;
      }

      const lowercaseQuery = query.toLowerCase();
      const filtered = data.filter((row) => {
        return columns.some((colName) => {
          const value = String(row.data[colName] || "").toLowerCase();
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
    debouncedSearch(searchQuery, selectedColumns, currentData);
  }, [searchQuery, selectedColumns, sectionData, sectionIndex]);

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
    setEditingRow(rowIndex);
    setEditedData({ ...currentData[rowIndex].data });
  };

  const handleSave = async (rowIndex: number) => {
    try {
      const currentData = sectionData[sectionIndex] || [];
      const response = await api.put(
        `/templates/${template.code}/sections/${sectionIndex}/data/${currentData[rowIndex].id}/`,
        {
          data: editedData,
        }
      );

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Data updated successfully",
        });

        await refreshSectionData(sectionIndex);
        setEditingRow(null);
        setEditedData(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update data",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const handleDelete = async (rowIndex: number) => {
    try {
      const currentData = sectionData[sectionIndex] || [];
      const response = await api.delete(
        `/templates/${template.code}/sections/${sectionIndex}/data/${currentData[rowIndex].id}/`
      );

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Data deleted successfully",
        });

        await refreshSectionData(sectionIndex);
        setShowDeleteDialog(false);
        setRowToDelete(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete data",
        variant: "destructive",
      });
    }
  };

  const renderCell = (
    row: any,
    column: any,
    rowIndex: number,
    colIndex: number
  ) => {
    if (editingRow === rowIndex) {
      return (
        <Input
          value={editedData[column.name] || ""}
          onChange={(e) =>
            setEditedData({ ...editedData, [column.name]: e.target.value })
          }
          className="h-8"
          autoFocus={colIndex === 0}
          type={
            column.data_type === "number"
              ? "number"
              : column.data_type === "date"
              ? "date"
              : "text"
          }
        />
      );
    }
    return row.data[column.name];
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
      {/* Search and Filter Section */}
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
          <DropdownMenuContent align="end" className="w-[200px]">
            {section.columns.map((column: any) => (
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
                {column.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredData.length} results
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead style={{ width: 100 }}>Actions</TableHead>
              {section.columns.map((column: any, index: number) => (
                <TableHead key={index}>{column.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={section.columns.length + 1}
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
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
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
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  {section.columns.map((column: any, colIndex: number) => (
                    <TableCell key={colIndex}>
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
