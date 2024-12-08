// components/user-management/roles/role-users-dialog.tsx
import { useState } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Department, Role, User } from "@/types/auth";
import { Search, UserMinus, UserPlus } from "lucide-react";
import userManagementService from "@/services/user_management";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { showToast } from "@/lib/toast";

interface RoleUsersDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleUsersDialog({
  role,
  open,
  onOpenChange,
}: RoleUsersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const queryClient = useQueryClient();

  // Fetch users with this role
  const { data: roleUsers = [], isLoading: isLoadingRoleUsers } = useQuery({
    queryKey: ["role-users", role.id],
    queryFn: () => userManagementService.fetchRoleUsers(role.id),
  });

  // Fetch departments for filtering
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: userManagementService.fetchDepartments,
  });

  // Fetch all users for adding to role
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userManagementService.fetchUsers,
  });

  // Filter users based on search and department
  const filteredUsers = roleUsers.filter((user: User) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" ||
      user.department?.id.toString() === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  // Get users not in role for adding
  const usersNotInRole = allUsers.filter(
    (user: User) => !roleUsers.find((ru: User) => ru.id === user.id)
  );

  const handleRemoveUser = async (user: User) => {
    try {
      await userManagementService.revokeRole(user.id, role.id);
      queryClient.invalidateQueries({ queryKey: ["role-users", role.id] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });

      showToast.success(`Removed ${user.username} from ${role.name} role`);
      setShowRemoveDialog(false);
    } catch (error) {
      showToast.error("Failed to remove user from role");
    }
  };

  const handleAddUser = async (userId: string) => {
    try {
      await userManagementService.assignRole(Number(userId), role.id);
      queryClient.invalidateQueries({ queryKey: ["role-users", role.id] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });

      showToast.success("User added to role successfully");
      setShowAddUserDialog(false);
    } catch (error) {
      showToast.error("Failed to add user to role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Users with {role.name} Role</DialogTitle>
          <DialogDescription>
            View and manage users assigned to this role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter Controls */}
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
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddUserDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Users Count */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {filteredUsers.length} users found
            </Badge>
          </div>

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Other Roles</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.department?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles
                          .filter((r) => r.id !== role.id)
                          .map((r) => (
                            <Badge key={r.id} variant="outline">
                              {r.name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRemoveDialog(true);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to {role.name}</DialogTitle>
            <DialogDescription>
              Select a user to add to this role
            </DialogDescription>
          </DialogHeader>
          <Select onValueChange={handleAddUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {usersNotInRole.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.username} from the{" "}
              {role.name} role? This may affect their access to certain
              features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleRemoveUser(selectedUser)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
