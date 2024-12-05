// components/user-management/users/user-permissions-dialog.tsx
import { useState, useEffect, useMemo, Fragment } from "react";
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
import { User, Permission } from "@/types/auth";
import { Search, Shield, User as UserIcon } from "lucide-react";
import userManagementService from "@/services/user_management";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showToast } from "@/lib/toast";

interface UserPermissionsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function groupPermissions(permissions: Permission[]) {
  return permissions.reduce((acc, permission) => {
    const moduleName = permission.module_name || "Other";
    if (!acc[moduleName]) {
      acc[moduleName] = {};
    }
    const resource = permission.resource || "General";
    if (!acc[moduleName][resource]) {
      acc[moduleName][resource] = [];
    }
    acc[moduleName][resource].push(permission);
    return acc;
  }, {} as Record<string, Record<string, Permission[]>>);
}

export function UserPermissionsDialog({
  user,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const queryClient = useQueryClient();

  // Fetch different types of permissions
  const { data: directPermissions = [], isLoading: isLoadingDirect } = useQuery(
    {
      queryKey: ["user-direct-permissions", user.id],
      queryFn: () => userManagementService.fetchUserDirectPermissions(user.id),
    }
  );

  const { data: rolePermissions = [], isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role-permissions", user.id],
    queryFn: () => userManagementService.fetchUserRolePermissions(user.id),
  });

  const isLoading = isLoadingDirect || isLoadingRole;

  // Combine and process permissions
  const allPermissions = useMemo(() => {
    const directSet = new Set(directPermissions.map((p) => p.id));

    return {
      direct: directPermissions.map((p) => ({
        ...p,
        source: "direct" as const,
      })),
      role: rolePermissions.map((p) => ({ ...p, source: "role" as const })),
      all: [
        ...directPermissions.map((p) => ({ ...p, source: "direct" as const })),
        ...rolePermissions
          .filter((p) => !directSet.has(p.id))
          .map((p) => ({ ...p, source: "role" as const })),
      ],
    };
  }, [directPermissions, rolePermissions]);

  // Initialize selected permissions with user's current direct permissions
  useEffect(() => {
    if (directPermissions.length > 0) {
      setSelectedPermissions(directPermissions.map((p) => p.id));
    }
  }, [directPermissions]);

  // Filter permissions based on search
  const filterPermissions = (permissions: typeof allPermissions.all) => {
    return permissions.filter(
      (permission) =>
        permission.full_codename
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        permission.module_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        permission.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (permission.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ??
          false)
    );
  };

  const handleSave = async () => {
    try {
      // Remove permissions that were unselected
      const permissionsToRemove = directPermissions
        .filter((permission) => !selectedPermissions.includes(permission.id))
        .map((permission) => permission.id);

      // Add newly selected permissions
      const permissionsToAdd = selectedPermissions.filter(
        (permissionId) => !directPermissions.find((p) => p.id === permissionId)
      );

      // Process removals
      await Promise.all(
        permissionsToRemove.map((permissionId) =>
          userManagementService.revokePermissionFromUser(user.id, permissionId)
        )
      );

      // Process additions
      await Promise.all(
        permissionsToAdd.map((permissionId) =>
          userManagementService.assignPermissionToUser(user.id, permissionId)
        )
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["user-direct-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-role-permissions"] });

      showToast.success("User permissions updated successfully");
      onOpenChange(false);
    } catch (error) {
      showToast.error("Failed to update user permissions");
    }
  };

  const getCurrentPermissions = () => {
    switch (activeTab) {
      case "direct":
        return allPermissions.direct;
      case "role":
        return allPermissions.role;
      default:
        return allPermissions.all;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissions for {user.username}</DialogTitle>
          <DialogDescription>
            Manage user permissions. Direct permissions can be modified, while
            role-based permissions are inherited from the user's roles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary">
                {directPermissions.length} direct permissions
              </Badge>
              <Badge variant="secondary">
                {rolePermissions.length} role permissions
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Permissions</TabsTrigger>
              <TabsTrigger value="direct">Direct Permissions</TabsTrigger>
              <TabsTrigger value="role">Role Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="border rounded-md mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab !== "role" && (
                        <TableHead className="w-[50px]"></TableHead>
                      )}
                      <TableHead>Permission</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(
                      groupPermissions(
                        filterPermissions(getCurrentPermissions())
                      )
                    ).map(([moduleName, resourceGroups]) => (
                      <Fragment key={moduleName}>
                        <TableRow className="bg-muted/50">
                          {activeTab !== "role" && <TableCell />}
                          <TableCell
                            colSpan={activeTab === "role" ? 5 : 6}
                            className="font-medium"
                          >
                            {moduleName}
                          </TableCell>
                        </TableRow>
                        {Object.entries(resourceGroups).map(
                          ([resource, permissions]) =>
                            permissions.map((permission) => (
                              <TableRow key={permission.id}>
                                {activeTab !== "role" && (
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedPermissions.includes(
                                        permission.id
                                      )}
                                      disabled={permission.source === "role"}
                                      onCheckedChange={() => {
                                        if (permission.source === "direct") {
                                          setSelectedPermissions((prev) =>
                                            prev.includes(permission.id)
                                              ? prev.filter(
                                                  (id) => id !== permission.id
                                                )
                                              : [...prev, permission.id]
                                          );
                                        }
                                      }}
                                    />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="font-mono text-sm">
                                          {permission.full_codename}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {permission.description ||
                                            "No description available"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>{permission.module_name}</TableCell>
                                <TableCell>{permission.resource}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {permission.action}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {permission.source === "direct" ? (
                                    <Badge variant="default" className="gap-1">
                                      <UserIcon className="h-3 w-3" />
                                      Direct
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="gap-1"
                                    >
                                      <Shield className="h-3 w-3" />
                                      Via Roles
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>

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
