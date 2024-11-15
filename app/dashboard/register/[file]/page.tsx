"use client";

import { useAuth } from "@/context/use-auth-context";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldStructure {
  type: string;
  options?: string[];
}

interface FileStructure {
  heading: string;
  structure: {
    [key: string]: FieldStructure;
  };
}

interface FormData {
  [key: string]: string | number;
}

interface TableRecord extends FormData {
  id: number;
}

export default function RegistrationPage() {
  const { files } = useAuth();
  const [formData, setFormData] = useState<FormData>({});
  const [tableData, setTableData] = useState<TableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [files]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<TableRecord[]>(
        "http://localhost:8000/api/records"
      );
      setTableData(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      await axios.post("http://localhost:8000/api/records", formData);
      await fetchData();
      setFormData({});
      toast({
        title: "Success",
        description: "Record saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (id: number) => {
    const record = tableData.find((item) => item.id === id);
    if (record) {
      setFormData(record);
      setEditingId(id);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setIsSaving(true);
      await axios.put(
        `http://localhost:8000/api/records/${editingId}`,
        formData
      );
      await fetchData();
      setFormData({});
      setEditingId(null);
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await axios.delete(
        `http://localhost:8000/api/records/${deleteDialog.id}`
      );
      await fetchData();
      setDeleteDialog({ open: false, id: null });
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const filteredData = tableData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Form Section */}
      {files.map((file: FileStructure, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{file.heading}</span>
              <Button
                onClick={editingId ? handleUpdate : handleSubmit}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Update Record" : "Save Record"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(file.structure).map(([key, field], keyIndex) => (
                <div key={keyIndex} className="space-y-2">
                  <Label htmlFor={key}>{key}</Label>
                  {field.type === "select" && field.options ? (
                    <Select
                      value={String(formData[key] || "")}
                      onValueChange={(value) => handleInputChange(key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${key}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={key}
                      type={field.type}
                      value={String(formData[key] || "")}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {files[0] &&
                      Object.keys(files[0].structure).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record, index) => (
                    <TableRow key={index}>
                      {Object.keys(files[0].structure).map((key) => (
                        <TableCell key={key}>{String(record[key])}</TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, id: record.id })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, id: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
