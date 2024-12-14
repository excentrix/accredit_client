// components/user-management/roles/role-permissions-dialog.tsx
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Role, Permission } from "@/types/auth";
import { Search } from "lucide-react";
import userManagementService from "@/services/user_management";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";

interface RolePermissionsDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function groupPermissions(permissions: Permission[]) {
  return permissions.reduce((acc, permission) => {
    const mod = permission.module_name || "Other";
    if (!acc[mod]) {
      acc[mod] = [];
    }
    acc[mod].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}

export function RolePermissionsDialog({
  role,
  open,
  onOpenChange,
}: RolePermissionsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const {
    data: permissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: userManagementService.fetchPermissions,
  });

  useEffect(() => {
    if (role.permissions) {
      const permissionIds = role.permissions.map((p) => p.id);
      setSelectedPermissions(permissionIds);
    }
  }, [role.permissions]);

  const filteredAndGroupedPermissions = groupPermissions(
    permissions.filter(
      (permission:any) =>
        permission.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.module?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllInModule = (
    modulePermissions: Permission[],
    selected: boolean
  ) => {
    setSelectedPermissions((prev) => {
      const permissionIds = modulePermissions.map((p) => p.id);
      if (selected) {
        return Array.from(new Set([...prev, ...permissionIds]));
      } else {
        return prev.filter((id) => !permissionIds.includes(id));
      }
    });
  };

  const handleSave = async () => {
    try {
      await userManagementService.updateRolePermissions(
        role.id,
        selectedPermissions
      );
      queryClient.invalidateQueries({ queryKey: ["roles"] });

      showToast.success("Role permissions updated successfully");
      onOpenChange(false);
    } catch (error) {
      showToast.error("Failed to update role permissions");
    }
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Failed to load permissions. Please try again.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {role.name}</DialogTitle>
          <DialogDescription>
            Select the permissions to assign to this role. Users with this role
            will inherit all selected permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {selectedPermissions.length} permissions selected
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(filteredAndGroupedPermissions).map(
                    ([module, modulePermissions]) => (
                      <>
                        <TableRow
                          key={`group-${module}`}
                          className="bg-muted/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={modulePermissions.every((p) =>
                                selectedPermissions.includes(p.id)
                              )}
                              onCheckedChange={(checked) =>
                                handleSelectAllInModule(
                                  modulePermissions,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell colSpan={3} className="font-medium">
                            {module}
                          </TableCell>
                        </TableRow>
                        {modulePermissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedPermissions.includes(
                                  permission.id
                                )}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permission.id)
                                }
                              />
                            </TableCell>
                            <TableCell>{permission.codename}</TableCell>
                            <TableCell>{permission.resource}</TableCell>
                            <TableCell>{permission.action}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
