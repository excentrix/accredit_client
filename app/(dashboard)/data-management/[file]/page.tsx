"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Loader2, Plus, Save, Trash2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FieldStructure {
  [key: string]: string;
}

interface FieldInput {
  name: string;
  type: string;
}

const FIELD_TYPES = [
  { value: "string", label: "Text String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "text", label: "Long Text" },
] as const;

export default function DataManagementPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("file");

  const [structure, setStructure] = useState<FieldStructure>({});
  const [newField, setNewField] = useState<FieldInput>({ name: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    field: string;
  }>({
    open: false,
    field: "",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchStructure();
  }, [fileId]);

  const fetchStructure = async () => {
    if (!fileId) {
      setError("No file ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8000/naac/${fileId}`);
      setStructure(response.data.structure);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch structure"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, type: string): string | null => {
    if (!name.trim()) return "Field name is required";
    if (!type) return "Field type is required";
    if (structure[name]) return "Field name already exists";
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      return "Field name must start with a letter and contain only letters, numbers, and underscores";
    }
    return null;
  };

  const addField = () => {
    const error = validateField(newField.name, newField.type);
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setStructure((prev) => ({
      ...prev,
      [newField.name]: newField.type,
    }));
    setNewField({ name: "", type: "" });
    setHasUnsavedChanges(true);
  };

  const deleteField = (fieldName: string) => {
    setDeleteDialog({ open: true, field: fieldName });
  };

  const confirmDelete = () => {
    const { field } = deleteDialog;
    const updatedStructure = { ...structure };
    delete updatedStructure[field];
    setStructure(updatedStructure);
    setDeleteDialog({ open: false, field: "" });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!fileId) return;

    try {
      setIsSaving(true);
      await axios.post(
        `http://localhost:8000/naac/${fileId}/update_structure/`,
        {
          structure,
        }
      );
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Structure updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update structure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Data Structure Management</span>
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Field List */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(structure).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>{value}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteField(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Add New Field */}
            <div className="flex items-center gap-4">
              <Input
                placeholder="Field Name"
                value={newField.name}
                onChange={(e) =>
                  setNewField({ ...newField, name: e.target.value })
                }
                className="max-w-xs"
              />
              <Select
                value={newField.type}
                onValueChange={(value) =>
                  setNewField({ ...newField, type: value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {/* Save Changes */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="w-[200px]"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open:any) => setDeleteDialog({ open, field: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the field "{deleteDialog.field}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, field: "" })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
