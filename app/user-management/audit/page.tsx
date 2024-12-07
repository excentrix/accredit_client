// app/user-management/audit/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { auditServices } from "@/services/user_management";

const AUDIT_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "user", label: "User Management" },
  { value: "role", label: "Role Changes" },
  { value: "department", label: "Department Changes" },
  { value: "permission", label: "Permission Changes" },
];

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [dateRange, setDateRange] = useState("7"); // days

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", activityType, dateRange],
    queryFn: () =>
      auditServices.fetchAuditLogs({
        type: activityType,
        days: parseInt(dateRange),
      }),
  });

  // Extract the audit logs from the response data
  const auditLogs = data?.data || [];

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter((log: any) =>
    Object.values(log).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleExport = async () => {
    try {
      await auditServices.exportAuditLogs({
        type: activityType,
        days: parseInt(dateRange),
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Log
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.user?.email || "System"}</TableCell>
                  <TableCell>{log.action_display}</TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {typeof log.details === "object"
                      ? JSON.stringify(log.details)
                      : log.details}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
