"use client";

import * as React from "react";
import { useEffect } from "react";
import { Command, Search, FileText, Database } from "lucide-react";
import { NavUser } from "@/components/nav-user";
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

const navItems = [
  {
    title: "Register",
    icon: FileText,
    path: "/register",
  },
  {
    title: "Data Management",
    icon: Database,
    path: "/data-management",
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { files, setFiles } = useAuth();
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = React.useState(
    navItems.find((item) => pathname.startsWith(item.path)) || navItems[0]
  );

  useEffect(() => {
    const currentItem = navItems.find((item) => pathname.startsWith(item.path));
    if (currentItem) {
      setActiveItem(currentItem);
    }
  }, [pathname]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/naac")
      .then((res) => res.json())
      .then((data: any) => {
        console.log(data);
        setFiles(data);
      });
  }, [activeItem]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* First sidebar with navigation */}
      <Sidebar
        collapsible="none"
        className="!w-[240px] border-r" // Increased width from calc value to fixed 240px
      >
        <SidebarHeader className="border-b p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8">
                <a href="/" className="flex items-center gap-3">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <span className="text-lg font-semibold">NAAC</span>
                </a>
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

      {/* Second sidebar with files list */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-slate-950 dark:text-slate-50">
              {activeItem.title}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-4">
            <SidebarGroupContent>
              {files.map((file: any) => (
                <Link
                  key={
                    file.subsection
                      ? `/${file.section}.${file.subsection}`
                      : `/${file.section}`
                  }
                  replace={true}
                  href={{
                    pathname:
                      activeItem.title === "Register"
                        ? file.subsection
                          ? `/register/${file.section}.${file.subsection}`
                          : `/register/${file.section}`
                        : activeItem.title === "Data Management"
                        ? file.subsection
                          ? `/data-management/${file.section}.${file.subsection}`
                          : `/data-management/${file.section}`
                        : "",
                    query: { file: file.id },
                  }}
                >
                  <div className="flex items-center gap-4 border-b p-4 last:border-b-0 hover:bg-sidebar-accent">
                    <Badge className="text-base tracking-wider">
                      {file.section}
                    </Badge>
                    <span className="text-sm">{file.heading}</span>
                  </div>
                </Link>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
