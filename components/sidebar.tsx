"use client";

import React from "react";
import { ResizablePanel } from "./ui/resizable";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { Nav } from "./nav";
import { File, Inbox } from "lucide-react";
type Props = {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
};

const Sidebar = ({
  defaultLayout = [20, 25, 40],
  defaultCollapsed = false,
  navCollapsedSize,
}: Props) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  return (
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
        isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
      )}
    >
      <div
        className={cn(
          "flex h-[52px] items-center justify-center",
          isCollapsed ? "h-[52px]" : "px-2"
        )}
      >
        {/* <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />  */}
        <span className="tracking-widest text-xl font-semibold">NAAC</span>
      </div>
      <Separator />
      <Nav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Dashboard",
            // label: "128",
            icon: Inbox,
            variant: "default",
            url: "/",
          },
        ]}
      />
      <Separator />
      <Nav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Data Management",
            // label: "972",
            icon: File,
            variant: "ghost",
            url: "/data-management",
          },
        ]}
      />
    </ResizablePanel>
  );
};

export default Sidebar;
