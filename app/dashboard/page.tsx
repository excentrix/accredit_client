// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/context/use-auth-context";
import { DepartmentBreakdown } from "@/components/submissions/department-breakdown";
import { SubmissionStats } from "@/components/submissions/submission-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/context/settings-context";
import { Activity, CheckCircle, Eye, Send, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// You'll need to implement these services
import { dashboardServices } from "@/services/core";
import { Role } from "@/types/auth";
import { DashboardActivity } from "@/services/dashboard";
import { formatDistanceToNow } from "date-fns";

const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Green
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#8884d8", // Purple
  "#82ca9d", // Light Green
  "#ffc658", // Light Orange
  "#8dd1e1", // Light Blue
  "#a4de6c", // Lime
  "#d0ed57", // Yellow Green
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedBoard, selectedAcademicYear } = useSettings();

  // Activity Timeline
  const { data: activityTimeline } = useQuery({
    queryKey: ["activity-timeline", selectedBoard, selectedAcademicYear],
    queryFn: () =>
      dashboardServices.fetchActivityTimeline({
        // board_id: selectedBoard,
        // academic_year: selectedAcademicYear,
        days: 30, // Last 30 days
      }),
    enabled: user?.roles.some((role: Role) =>
      ["admin", "iqac_director"].includes(role.name)
    ),
  });

  // Criteria Completion
  const { data: criteriaCompletion } = useQuery({
    queryKey: ["criteria-completion", selectedBoard, selectedAcademicYear],
    queryFn: () =>
      dashboardServices.fetchCriteriaCompletion({
        // board_id: selectedBoard,
        // academic_year: selectedAcademicYear,
      }),
    enabled: user?.roles.some((role: Role) =>
      ["admin", "iqac_director"].includes(role.name)
    ),
  });

  // Recent Activity
  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", selectedBoard, selectedAcademicYear],
    queryFn: () =>
      dashboardServices.fetchRecentActivity({
        limit: 10,
        department_id: user?.department?.id,
      }),
    enabled: user?.roles.some((role: Role) =>
      ["admin", "iqac_director"].includes(role.name)
    ),
  });

  // faculty Activity
  const { data: facultyActivity } = useQuery({
    queryKey: [
      "faculty-activity",
      user?.department?.id,
      selectedAcademicYear,
      selectedBoard,
    ],
    queryFn: () =>
      dashboardServices.fetchRecentActivity({
        department_id: user?.department?.id,
        limit: 10,
      }),
    enabled:
      user?.roles.some((role) => role.name === "faculty") &&
      !!user?.department?.id,
  });

  if (!user) return null;
  if (!selectedBoard || !selectedAcademicYear) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Board and Academic Year Required
          </h2>
          <p className="text-muted-foreground">
            Please select a board and academic year from the settings menu.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.roles.some((role) => role.name === "admin");
  const isIQACDirector = user.roles.some(
    (role) => role.name === "iqac_director"
  );
  const isFaculty = user.roles.some((role) => role.name === "faculty");

  const renderActivityTimeline = () => {
    if (!activityTimeline?.length) {
      return <div className="text-center p-4">No activity data available</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={activityTimeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="submissions"
            stroke={COLORS[0]}
            name="Submissions"
          />
          <Line
            type="monotone"
            dataKey="approvals"
            stroke={COLORS[1]}
            name="Approvals"
          />
          <Line
            type="monotone"
            dataKey="rejections"
            stroke={COLORS[2]}
            name="Rejections"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderCriteriaCompletion = () => {
    if (!criteriaCompletion?.length) {
      return <div className="text-center p-4">No criteria data available</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={criteriaCompletion}
            dataKey="completed"
            nameKey="criterion_number"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `Criterion ${name}: ${value}%`}
          >
            {criteriaCompletion.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const ActivityIcon = ({ action }: { action: string }) => {
    const iconMap = {
      submitted: <Send className="h-4 w-4 text-blue-500" />,
      approved: <CheckCircle className="h-4 w-4 text-green-500" />,
      rejected: <XCircle className="h-4 w-4 text-red-500" />,
      reviewed: <Eye className="h-4 w-4 text-yellow-500" />,
    };

    return (
      iconMap[action as keyof typeof iconMap] || (
        <Activity className="h-4 w-4" />
      )
    );
  };

  const renderRecentActivity = (
    activities: DashboardActivity[] | undefined
  ) => {
    if (!activities?.length) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          No recent activity to display
        </div>
      );
    }

    return activities.map((activity) => (
      <div
        key={activity.id}
        className="flex items-center gap-4 border-b py-4 last:border-0"
      >
        <div className="flex-shrink-0">
          <ActivityIcon action={activity.action} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {activity.user.name} {activity.action_display.toLowerCase()} a
            submission
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {activity.template.name} (Criterion {activity.template.criterion})
            {activity.department && ` - ${activity.department.name}`}
          </p>
        </div>

        <time className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(activity.timestamp))} ago
        </time>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.username}</p>
        </div>
      </div>

      {/* admin & iqac_director View */}
      {(isAdmin || isIQACDirector) && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SubmissionStats />

            <Card>
              <CardHeader>
                <CardTitle>Submission Activity</CardTitle>
              </CardHeader>
              <CardContent>{renderActivityTimeline()}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {renderRecentActivity(recentActivity)}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentBreakdown />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Criteria-wise Completion</CardTitle>
              </CardHeader>
              <CardContent>{renderCriteriaCompletion()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* faculty View */}
      {isFaculty && (
        <div className="space-y-6">
          {/* Faculty Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* ... faculty stats cards remain the same ... */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {renderRecentActivity(facultyActivity)}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
