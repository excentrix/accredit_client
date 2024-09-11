"use client";

import * as React from "react";
import { File, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Nav } from "@/components/nav";

interface LayoutProps {
  children: React.ReactNode;
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize?: number;
}

export function Layout({
  children,
  defaultLayout = [20, 80],
  defaultCollapsed = false,
  navCollapsedSize = 4,
}: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`;
        }}
        className="h-full max-h-screen w-full items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={10}
          maxSize={15}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`;
          }}
          onResize={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`;
          }}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px]" : "px-2"
            )}
          >
            <span className="tracking-widest text-xl font-semibold">NAAC</span>
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Dashboard",
                icon: Inbox,
                variant: "default",
                url: "/",
              },
              {
                title: "Data Management",
                icon: File,
                variant: "ghost",
                url: "/data-management",
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
