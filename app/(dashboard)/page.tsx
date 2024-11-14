"use client";

import { useAuth } from "@/context/use-auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome, {user?.first_name || user?.username}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">
              {user?.role.replace("_", " ")}
            </p>
          </CardContent>
        </Card>

        {user?.department && (
          <Card>
            <CardHeader>
              <CardTitle>Department</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{user.department.name}</p>
              <p className="text-sm text-muted-foreground">
                {user.department.code}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
