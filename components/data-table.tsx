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
import {
  Plus,
  Edit2,
  Check,
  X,
  Trash2,
  Save,
  Filter,
  Search,
} from "lucide-react";
import { Template } from "@/types/template";
import { DataEntryForm } from "./data-entry-form";
import { useToast } from "./ui/use-toast";
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

interface DataTableProps {
  template: Template;
}

export function DataTable({ template }: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    template.columns.map((col) => col.name)
  );
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const debouncedSearch = useCallback(
    debounce((query: string, columns: string[]) => {
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
    [data]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, selectedColumns);
  }, [searchQuery, selectedColumns, data]);

  const refreshData = async () => {
    try {
      const response = await api.get(`/templates/${template.code}/data/`);
      if (response.data.status === "success") {
        setData(response.data.data.rows);
        setFilteredData(response.data.data.rows);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data entries",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshData();
  }, [template.code]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (editingRow !== null && e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave(editingRow);
      } else if (editingRow !== null && e.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [editingRow, editedData]);

  const handleEdit = (rowIndex: number) => {
    setEditingRow(rowIndex);
    setEditedData({ ...data[rowIndex].data });
  };

  const handleSave = async (rowIndex: number) => {
    try {
      const response = await api.put(
        `/templates/${template.code}/data/row/?row_id=${data[rowIndex].id}`,
        {
          data: editedData,
        }
      );

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Data updated successfully",
        });

        await refreshData();
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
      const response = await api.delete(
        `/templates/${template.code}/data/row/?row_id=${data[rowIndex].id}`
      );

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Data deleted successfully",
        });

        await refreshData();
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
        />
      );
    }
    return row.data[column.name];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Data Entries</h2>
        <DataEntryForm template={template} onSuccess={refreshData} />
      </div>

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
            {template.columns.map((column) => (
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
                {column.display_name}
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
              {template.columns.map((column, index) => (
                <TableHead key={index}>{column.display_name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={template.columns.length + 1}
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
                  {template.columns.map((column, colIndex) => (
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
                  setShowDeleteDialog(false);
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
