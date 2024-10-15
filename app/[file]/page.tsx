"use client";

import { MenuPanel } from "@/components/menuPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePathname } from "next/navigation";

export default function Page() {
  const pathname = usePathname();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
        <MenuPanel title="Register" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <main>{pathname}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
