// components/user-management/permissions-view.tsx
import { Fragment, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Module, Permission } from "@/types/auth";
import { Search } from "lucide-react";
import userManagementService from "@/services/user_management";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type GroupedPermissions = Record<string, Record<string, Permission[]>>;

export function PermissionsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  const {
    data: permissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: userManagementService.fetchPermissions,
  });

  // Get unique modules from permissions
  const uniqueModules = useMemo(() => {
    const moduleMap = new Map();
    permissions.forEach((permission: Permission) => {
      if (permission.module && !moduleMap.has(permission.module_name)) {
        moduleMap.set(permission.module_name, permission.module);
      }
    });
    return Array.from(moduleMap.values());
  }, [permissions]);

  // Get unique resources
  const uniqueResources = useMemo(() => {
    return Array.from(
      new Set(permissions.map((p: Permission) => p.resource).filter(Boolean))
    );
  }, [permissions]);

  // Filter permissions based on search and filters
  const filterPermissions = (perms: Permission[]) => {
    if (!Array.isArray(perms)) return [];

    return perms.filter((permission) => {
      const matchesSearch =
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
          false);

      const matchesModule =
        moduleFilter === "all" ||
        (permission.module && permission.module.id.toString() === moduleFilter);

      const matchesResource =
        resourceFilter === "all" || permission.resource === resourceFilter;

      return matchesSearch && matchesModule && matchesResource;
    });
  };

  // Group permissions by module and resource
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc: GroupedPermissions, permission:Permission) => {
      const moduleName = permission.module_name || "Other";
      const resource = permission.resource || "General";

      if (!acc[moduleName]) {
        acc[moduleName] = {};
      }
      if (!acc[moduleName][resource]) {
        acc[moduleName][resource] = [];
      }
      acc[moduleName][resource].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  // Stats calculation
  const stats = useMemo(
    () => ({
      totalPermissions: permissions.length,
      totalModules: uniqueModules.length,
      totalResources: uniqueResources.length,
    }),
    [permissions, uniqueModules, uniqueResources]
  );

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>Error Loading Permissions</CardTitle>
            <CardDescription>
              There was a problem loading the permissions. Please try refreshing
              the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
            <Badge>{stats.totalPermissions}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              System-wide permissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Badge>{stats.totalModules}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <p className="text-xs text-muted-foreground">Functional modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Badge>{stats.totalResources}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResources}</div>
            <p className="text-xs text-muted-foreground">Protected resources</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {permissions
              .reduce((acc: Module[], curr: any) => {
                if (!acc.find((m) => m === curr)) {
                  acc.push(curr);
                }
                return acc;
              }, [])
              .map((module: Module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions List */}
      <Accordion type="single" collapsible className="space-y-4">
        {Object.entries(groupedPermissions).map(([module, resourceGroups]) => {
          const modulePermissions = Object.values(
            resourceGroups as Record<string, Permission[]>
          ).flat();
          const filteredModulePermissions =
            filterPermissions(modulePermissions);

          if (filteredModulePermissions.length === 0) return null;

          return (
            <AccordionItem key={module} value={module}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{module}</span>
                    <Badge variant="secondary">
                      {filteredModulePermissions.length} permissions
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border rounded-md mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Roles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions).map(
                        ([moduleName, resourceGroups]) => {
                          const modulePermissions = Object.values(
                            resourceGroups as Record<string, Permission[]>
                          ).flat();
                          const filteredModulePermissions =
                            filterPermissions(modulePermissions);

                          if (filteredModulePermissions.length === 0)
                            return null;

                          return (
                            <Fragment key={moduleName}>
                              <TableRow className="bg-muted/50">
                                <TableCell colSpan={6} className="font-medium">
                                  {moduleName}
                                </TableCell>
                              </TableRow>
                              {Object.entries(
                                resourceGroups as Record<string, Permission[]>
                              ).map(([resource, permissions]) => {
                                const filteredPermissions =
                                  filterPermissions(permissions);
                                if (filteredPermissions.length === 0)
                                  return null;

                                return filteredPermissions.map((permission) => (
                                  <TableRow key={permission.id}>
                                    <TableCell>
                                      <div className="font-mono text-sm">
                                        {permission.full_codename}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {permission.module_name}
                                    </TableCell>
                                    <TableCell>{permission.resource}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {permission.action}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm text-muted-foreground">
                                        {permission.description || "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1 flex-wrap">
                                        {permission.roles?.map((role) => (
                                          <Badge
                                            key={role.id}
                                            variant="secondary"
                                          >
                                            {role.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ));
                              })}
                            </Fragment>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Empty State */}
      {Object.values(groupedPermissions)
        .flatMap((resourceGroups) =>
          Object.values(resourceGroups as Record<string, Permission[]>).flat()
        )
        .filter((permission) => filterPermissions([permission]).length > 0)
        .length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No permissions found matching your criteria
        </div>
      )}
    </div>
  );
}
