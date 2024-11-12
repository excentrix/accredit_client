"use client";

import { useAuth } from "@/context/use-auth-context";
import DataEntry from "@/components/data-entry";
import { MenuPanel } from "@/components/menuPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePathname } from "next/navigation";

export default function Page() {
  const { files } = useAuth();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
        <MenuPanel title="Register" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <DataEntry files={files} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
