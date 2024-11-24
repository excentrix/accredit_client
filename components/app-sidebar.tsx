// components/app-sidebar.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Command,
  Search,
  FileText,
  Database,
  Layout,
  Loader2,
  Plus,
  FileClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/context/use-auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Template } from "@/types/template";
import { Board } from "@/types/board";
import api from "@/lib/api";
import { NavUser } from "./nav-user";
import path from "path";

const mainNavItems = [
  {
    title: "Dashboard",
    icon: Layout,
    path: "/dashboard",
  },
  {
    title: "Data",
    icon: FileText,
    path: "/dashboard/data",
  },
  {
    title: "Submissions",
    icon: FileClock,
    path: "/dashboard/submissions",
  },
  {
    title: "Template Management",
    icon: Database,
    path: "/dashboard/template-management",
  },
  {
    title: "Export",
    icon: FileText,
    path: "/dashboard/export",
  },
];

const contextConfig = {
  "/dashboard/data": {
    title: "Data Entry",
    showSearch: true,
    showTemplates: true,
    searchPlaceholder: "Search templates...",
  },
  "/dashboard/template-management": {
    title: "Template Management",
    showSearch: false,
    showTemplates: false,
    searchPlaceholder: "Search data...",
  },
  "/dashboard": {
    title: "Dashboard",
    showSearch: false,
    showTemplates: false,
    searchPlaceholder: "",
  },
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("NAAC");

  const currentContext =
    Object.entries(contextConfig).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || contextConfig["/dashboard"];

  React.useEffect(() => { 
    const fetchBoards = async () => {
      const boards = await api.get("/boards/");
      console.log("BOARDS", boards.data);
      setBoards(boards.data);
      console.log("selected board 1 : ", selectedBoard);
    };
    fetchBoards();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentContext.showTemplates) return;

      try {
        setIsLoading(true);
        setError(null);
        console.log("selected board: ", selectedBoard);
        const response = await api.get("/templates/",{
          params: { board: selectedBoard }
        });
        setTemplates(response.data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch templates"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [currentContext.showTemplates]);

  const groupedTemplates = React.useMemo(() => {
    if (!templates.length) return {};

    return templates.reduce<Record<string, Template[]>>((acc, template) => {
      const criteria = template.code.split(".").slice(0, 2).join(".");
      if (!acc[criteria]) {
        acc[criteria] = [];
      }
      acc[criteria].push(template);
      return acc;
    }, {});
  }, [templates]);

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

  const renderSecondaryContent = () => {
    if (!currentContext.showTemplates) return null;

    return (
      <>
        {currentContext.showSearch && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={currentContext.searchPlaceholder}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
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
            <>
              {Object.entries(filteredTemplates).map(
                ([criteria, templatesGroup]) => (
                  <Collapsible
                    key={criteria}
                    defaultOpen
                    className="group/collapsible"
                  >
                    <SidebarGroup>
                      <SidebarGroupLabel className="px-4 hover:bg-sidebar-accent rounded-lg">
                        <CollapsibleTrigger className="flex w-full items-center">
                          <h3 className="text-sm font-semibold text-secondary">
                            Criteria {criteria}
                          </h3>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                      </SidebarGroupLabel>
                      <CollapsibleContent>
                        {templatesGroup.map((template) => (
                          <Link
                            key={template.id}
                            href={
                              pathname.startsWith("/dashboard/data")
                                ? `/dashboard/data/${template.code}`
                                : `/dashboard/template-management/${template.code}`
                            }
                            className="block"
                          >
                            <div className="flex w-full justify-between gap-4 border-b pl-6 p-4 last:border-b-0 hover:bg-sidebar-accent rounded-lg">
                              <span className="text-sm line-clamp-2">
                                {template.name}
                              </span>
                              <span className="text-sm line-clamp-2">
                                {template.code}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </SidebarGroup>
                  </Collapsible>
                )
              )}
            </>
          )}
        </SidebarContent>
      </>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* Primary Sidebar */}
      <Sidebar collapsible="none" className="!w-[240px] border-r">
        <SidebarHeader className="border-b p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-12">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-lg font-semibold">Accredit</span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" asChild className="md:h-12">
                    <div className="flex gap-0.3 leading-none">
                      <span className="">{selectedBoard}</span>
                      <ChevronsUpDown className="ml-auto" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width]"
                  align="start"
                >
                  {boards.map((board) => (
                    <DropdownMenuItem
                      key={board.code}
                      onSelect={() => setSelectedBoard(board.code)}
                    >
                      {board.code}{" "}
                      {board.code === selectedBoard && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="p-2">
              <SidebarMenu>
                {mainNavItems.map((item) => (
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
        <SidebarFooter className="p-4">
          <NavUser
            user={{
              name: "Sid karthik",
              email: "sid@test.com",
              avatar: "admin",
            }}
          />
        </SidebarFooter>
      </Sidebar>

      {/* Secondary Sidebar */}
      <Sidebar
        collapsible="none"
        className={cn(
          "hidden md:flex flex-1",
          "transition-[flex-basis,width] motion-reduce:transition-none",
          "[&:has([data-collapsed=true])]:basis-[var(--collapsed-width)]",
          "[&:has([data-collapsed=true])]:min-w-[var(--collapsed-width)]"
        )}
      >
        <SidebarHeader className="border-b p-4">
          <h2 className="text-lg font-semibold">{currentContext.title}</h2>
        </SidebarHeader>
        {renderSecondaryContent()}
      </Sidebar>
    </Sidebar>
  );
}
