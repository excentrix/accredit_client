import { MenuPanel } from "@/components/menuPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function DataManagement() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
        <MenuPanel title="Data Management" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <main>
          <h1>Data Management Main Content</h1>
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
