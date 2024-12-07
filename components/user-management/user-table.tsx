// components/user-management/user-table.tsx
import { useState, useCallback, useEffect } from "react";
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
  MoreHorizontal,
  Search,
  Filter,
  Shield,
  Building,
  Key,
} from "lucide-react";
import { User, Role, Department } from "@/types/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import userManagementService from "@/services/user_management";
import { showToast } from "@/lib/toast";

import { RoleManagementDialog } from "./roles/role-management-dialog";
import { DepartmentDialog } from "./departments/departments-dialog";
import { UserPermissionsDialog } from "./users/user-permissions-dialog";

export function UserTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => userManagementService.fetchUsers(),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => userManagementService.fetchRoles(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => userManagementService.fetchDepartments(),
  });

  // Filtered users
  const filteredUsers =
    users?.filter((user: User) =>
      Object.values(user).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) ?? [];

  const columns = [
    {
      name: "user",
      display_name: "User",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.username}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      name: "roles",
      display_name: "Roles",
      render: (user: User) => (
        <div className="flex gap-1 flex-wrap">
          {user.roles?.map((role) => (
            <Badge key={role.id} variant="secondary">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      name: "department",
      display_name: "Department",
      render: (user: User) => user.department?.name || "-",
    },
    {
      name: "status",
      display_name: "Status",
      render: (user: User) => (
        <Badge variant={user.is_active ? "default" : "secondary"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await userManagementService.updateUser(userId, { is_active: isActive });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      showToast.error("Failed to update user status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.name}>{column.display_name}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user: User) => (
              <TableRow key={user.id}>
                {columns.map((column) => (
                  <TableCell key={column.name}>{column.render(user)}</TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRolesDialog(true);
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Manage Roles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDepartmentDialog(true);
                        }}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        Assign Department
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionsDialog(true);
                        }}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Individual Permissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateUserStatus(user.id, !user.is_active)
                        }
                      >
                        {user.is_active ? "Deactivate" : "Activate"} User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Role Management Dialog */}
      {selectedUser && (
        <RoleManagementDialog
          open={showRolesDialog}
          onOpenChange={setShowRolesDialog}
          user={selectedUser}
          roles={roles || []}
        />
      )}

      {/* Department Assignment Dialog */}
      {selectedUser && (
        <DepartmentDialog
          open={showDepartmentDialog}
          onOpenChange={setShowDepartmentDialog}
          user={selectedUser}
          departments={departments || []}
        />
      )}

      {/* Individual Permissions Dialog */}
      {selectedUser && (
        <UserPermissionsDialog
          open={showPermissionsDialog}
          onOpenChange={setShowPermissionsDialog}
          user={selectedUser}
        />
      )}
    </div>
  );
}
