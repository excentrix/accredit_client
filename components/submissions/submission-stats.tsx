// components/submissions/submission-stats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ListChecks, Clock, CheckCircle, XCircle } from "lucide-react";
import { submissionStatsServices } from "@/services/core";

export function SubmissionStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["submission-stats"],
    queryFn: async () => {
      const response = await submissionStatsServices.fetchSubmissionStats();
      
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Review",
      value: stats?.pending || 0,
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      description: "Awaiting review",
      color: "border-l-4 border-l-yellow-500",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      description: "Successfully approved",
      color: "border-l-4 border-l-green-500",
    },
    {
      title: "Rejected",
      value: stats?.rejected || 0,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      description: "Needs revision",
      color: "border-l-4 border-l-red-500",
    },
    {
      title: "Total Submissions",
      value: stats?.total || 0,
      icon: <ListChecks className="h-4 w-4 text-blue-500" />,
      description: "All submissions",
      color: "border-l-4 border-l-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index} className={card.color}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
