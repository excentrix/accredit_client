"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Template } from "@/types/template";
import { DataEntryForm } from "./data-entry-form";
import { useToast } from "./ui/use-toast";
import api from "@/lib/api";

interface DataTableProps {
  template: Template;
}

export function DataTable({ template }: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();

  const refreshData = async () => {
    try {
      const response = await api.get(`/templates/${template.code}/data/`);
      if (response.data.status === "success") {
        setData(response.data.data.rows);
        // console.log(
        // "Data:",
        // response.data.data.rows.map((row: any) => {
        //   console.log(row.data);
        // });
        // ); // Debug log
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
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Data Entries</h2>
        <DataEntryForm template={template} onSuccess={refreshData} />
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {template.columns.map((column, index) => (
                <TableHead key={index}>{column.display_name}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={template.columns.length + 1}
                  className="text-center h-32 text-muted-foreground"
                >
                  No entries found. Add some data to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                console.log(row);
                return (
                  <TableRow key={index}>
                    {template.columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>{row.data[column.name]}</TableCell>
                    ))}
                    <TableCell>{/* Add edit/delete actions here */}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
