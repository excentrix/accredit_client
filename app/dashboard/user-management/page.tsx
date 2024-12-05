// app/dashboard/user-management/page.tsx
"use client";

import { useState } from "react";
import { UserTable } from "@/components/user-management/user-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UserForm } from "@/components/user-management/user-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UsersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and their access levels
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <UserTable />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user and assign their roles and permissions.
            </DialogDescription>
          </DialogHeader>
          <UserForm onSubmit={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
