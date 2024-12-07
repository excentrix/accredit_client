// app/user-management/layout.tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { usePathname, useRouter } from "next/navigation";

const managementTabs = [
  { id: "users", label: "Users", path: "/user-management" },
  {
    id: "roles",
    label: "Roles & Permissions",
    path: "/user-management/roles",
  },
  {
    id: "departments",
    label: "Departments",
    path: "/user-management/departments",
  },
  { id: "audit", label: "Audit Log", path: "/user-management/audit" },
];

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab =
    managementTabs.find((tab) => tab.path === pathname)?.id || "users";

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, permissions, and departments
          </p>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(value) => {
          const tab = managementTabs.find((t) => t.id === value);
          if (tab) router.push(tab.path);
        }}
      >
        <TabsList className="grid w-full grid-cols-4">
          {managementTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="p-6">{children}</Card>
    </div>
  );
}
