// components/user-management/user-list.tsx
import React from "react";

import { useQuery } from "@tanstack/react-query";
import userManagementService from "@/services/user_management";
import { columns } from "./columns";
import { UserTable } from "./user-table";

export function UserList() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userManagementService.fetchUsers(),
  });

  if (isLoading) return <div>Loading...</div>;

  return <UserTable />;
}
