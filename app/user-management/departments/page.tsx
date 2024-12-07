// app/user-management/departments/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userManagementService from "@/services/user_management";
import { toast } from "react-hot-toast";

interface DepartmentFormData {
  name: string;
  code: string;
}

function DepartmentForm({
  onSubmit,
  initialData = null,
}: {
  onSubmit: () => void;
  initialData?: { id: number; name: string; code: string } | null;
}) {
  const [formData, setFormData] = useState<DepartmentFormData>(
    initialData || { name: "", code: "" }
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: DepartmentFormData) =>
      initialData
        ? userManagementService.updateDepartment(initialData.id, data)
        : userManagementService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success(
        `Department ${initialData ? "updated" : "created"} successfully`
      );
      onSubmit();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save department");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Department Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter department name"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Department Code</label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="Enter department code"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSubmit}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export default function DepartmentsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editDepartment, setEditDepartment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: userManagementService.fetchDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userManagementService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete department");
    },
  });

  const filteredDepartments = departments?.filter(
    (dept: any) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditDepartment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Departments</h2>
          <p className="text-sm text-muted-foreground">
            Manage academic departments and their codes
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDepartments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments?.map((dept: any) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.users_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditDepartment(dept);
                          setShowDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this department?"
                            )
                          ) {
                            deleteMutation.mutate(dept.id);
                          }
                        }}
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

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editDepartment ? "Edit Department" : "Create New Department"}
            </DialogTitle>
            <DialogDescription>
              {editDepartment
                ? "Update department details"
                : "Add a new department to the system"}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            onSubmit={handleCloseDialog}
            initialData={editDepartment}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
