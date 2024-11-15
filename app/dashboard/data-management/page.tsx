// app/dashboard/data-management/page.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "@/components/data-management/template-manager";
import { CriteriaManager } from "@/components/data-management/criteria-manager";
import { ConfigManager } from "@/components/data-management/config-manager";

export default function DataManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">
          Manage templates, criteria, and configurations
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          <CriteriaManager />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <ConfigManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
