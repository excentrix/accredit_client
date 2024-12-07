// components/user-management/departments/department-dialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Department } from "@/types/auth";
import userManagementService from "@/services/user_management";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";

interface DepartmentDialogProps {
  user: User;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepartmentDialog({
  user,
  departments,
  open,
  onOpenChange,
}: DepartmentDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    user.department?.id || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (selectedDepartment) {
        await userManagementService.assignUserToDepartment(
          user.id,
          selectedDepartment
        );
      } else {
        await userManagementService.removeUserFromDepartment(user.id);
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });

      showToast.success("User department updated successfully");
      onOpenChange(false);
    } catch (error) {
      showToast.error("Failed to update user department");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Department for {user.username}</DialogTitle>
          <DialogDescription>
            Select a department to assign to this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-72 rounded-md border p-4">
            <RadioGroup
              value={selectedDepartment?.toString()}
              onValueChange={(value) =>
                setSelectedDepartment(value ? parseInt(value) : null)
              }
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="no-department" />
                  <Label htmlFor="no-department">No Department</Label>
                </div>
                {filteredDepartments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={dept.id.toString()}
                      id={`dept-${dept.id}`}
                      checked={selectedDepartment == dept.id}
                    />
                    <Label htmlFor={`dept-${dept.id}`}>
                      <div>{dept.name}</div>
                      <p className="text-sm text-muted-foreground">
                        Code: {dept.code}
                      </p>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
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
