// components/user-management/roles/role-management-dialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Role, User } from "@/types/auth";
import userManagementService from "@/services/user_management";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";

interface RoleManagementDialogProps {
  user: User;
  roles: Role[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleManagementDialog({
  user,
  roles,
  open,
  onOpenChange,
}: RoleManagementDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    user.roles?.map((role) => role.id) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Remove roles that were unselected
      const rolesToRemove = user.roles
        .filter((role) => !selectedRoles.includes(role.id))
        .map((role) => role.id);

      // Add newly selected roles
      const rolesToAdd = selectedRoles.filter(
        (roleId) => !user.roles.find((role) => role.id === roleId)
      );

      // Process removals
      await Promise.all(
        rolesToRemove.map((roleId) =>
          userManagementService.revokeRole(user.id, roleId)
        )
      );

      // Process additions
      await Promise.all(
        rolesToAdd.map((roleId) =>
          userManagementService.assignRole(user.id, roleId)
        )
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });

      showToast.success("User roles updated successfully");
      onOpenChange(false);
    } catch (error) {
      showToast.error("Failed to update user roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Roles for {user.username}</DialogTitle>
          <DialogDescription>
            Select the roles to assign to this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Selected roles:
            </span>
            <Badge variant="secondary">{selectedRoles.length} selected</Badge>
          </div>

          <ScrollArea className="h-72 rounded-md border p-4">
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <div>{role.name}</div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
