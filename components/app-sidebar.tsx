// components/app-sidebar.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Command,
  Search,
  FileText,
  Database,
  Users,
  Settings,
  Layout,
  Loader2,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/use-auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Template } from "@/types/template";
import api from "@/lib/api"; // Import the api instance
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
// import { AddTemplateForm } from "./addtemplateform";

const navItems = [
  {
    title: "Data",
    icon: FileText,
    path: "/dashboard/data",
  },
  {
    title: "Template Management",
    icon: Database,
    path: "/dashboard/template-management",
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = React.useState(
    navItems.find((item) => pathname.startsWith(item.path)) || navItems[0]
  );

  useEffect(() => {
    const currentItem = navItems.find((item) => pathname.startsWith(item.path));
    if (currentItem) {
      setActiveItem(currentItem);
    }
  }, [pathname]);

  // Fetch templates with authorization
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/templates/");
        console.log("Template response:", response.data); // Debug log

        if (response.data) {
          setTemplates(response.data);
        } else {
          throw new Error("No data received from server");
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        const message =
          error instanceof Error ? error.message : "Failed to fetch templates";
        setError(message);
        // toast({
        //   title: "Error",
        //   description: message,
        //   variant: "destructive",
        // });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTemplates();
    }
  }, [user]);

  // Group templates by criteria
  const groupedTemplates = React.useMemo(() => {
    if (!templates.length) return {}; // Return empty object if no templates

    return templates.reduce<Record<string, Template[]>>((acc, template) => {
      // Extract criteria from template code (e.g., "1.1" from "1.1.1")
      const criteria = template.code.split(".").slice(0, 2).join(".");
      if (!acc[criteria]) {
        acc[criteria] = [];
      }
      acc[criteria].push(template);
      return acc;
    }, {});
  }, [templates]);

  // Filter templates based on search query
  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery) return groupedTemplates;

    const filtered: Record<string, Template[]> = {};
    Object.entries(groupedTemplates).forEach(([criteria, templatesGroup]) => {
      const matchingTemplates = templatesGroup.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingTemplates.length > 0) {
        filtered[criteria] = matchingTemplates;
      }
    });
    return filtered;
  }, [groupedTemplates, searchQuery]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* First sidebar with navigation */}
      <Sidebar collapsible="none" className="!w-[240px] border-r">
        <SidebarHeader className="border-b p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <span className="text-lg font-semibold">NAAC</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="p-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.path} className="w-full">
                      <SidebarMenuButton
                        className={cn(
                          "w-full p-3 flex items-center gap-3 rounded-lg",
                          pathname.startsWith(item.path)
                            ? "bg-sidebar-accent text-primary font-medium shadow-sm"
                            : "hover:bg-sidebar-accent/50 transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-5",
                            pathname.startsWith(item.path) && "text-primary"
                          )}
                        />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Second sidebar with templates list */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          {/* ... header content ... */}
        </SidebarHeader>
        <SidebarContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <SidebarGroup className="px-4">
              <SidebarGroupContent>
                {Object.entries(filteredTemplates).map(
                  ([criteria, templatesGroup]) => (
                    <div key={criteria} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Criteria {criteria}
                        </Badge>
                      </div>
                      {templatesGroup.map((template) => (
                        <Link
                          key={template.id}
                          href={`/dashboard/data/${template.code}`}
                          className="block"
                        >
                          <div className="flex items-center gap-4 border-b p-4 last:border-b-0 hover:bg-sidebar-accent rounded-lg">
                            <Badge className="text-base tracking-wider">
                              {template.code}
                            </Badge>
                            <span className="text-sm line-clamp-2">
                              {template.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                )}
                {Object.keys(filteredTemplates).length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? (
                      <p>No templates found matching your search.</p>
                    ) : (
                      <p>No templates available.</p>
                    )}
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
