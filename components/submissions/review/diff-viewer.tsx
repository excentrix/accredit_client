// components/submissions/review/diff-viewer.tsx
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, ArrowRight } from "lucide-react";

interface DiffChange {
  type: "changed" | "added" | "removed";
  path: string;
  old_value?: any;
  new_value?: any;
}

interface DiffViewerProps {
  changes: DiffChange[];
}

export function DiffViewer({ changes }: DiffViewerProps) {
  const formatPath = (path: string) => {
    return path
      .replace(/root\['/, "")
      .replace(/'\]/, "")
      .replace(/\[|\]/g, ".")
      .replace(/[']/g, "")
      .trim();
  };

  const formatValue = (value: any) => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {changes.map((change, index) => (
          <div
            key={index}
            className="rounded-lg border bg-muted/50 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  change.type === "changed"
                    ? "default"
                    : change.type === "added"
                    ? "secondary"
                    : "destructive"
                }
              >
                {change.type === "changed" && "Modified"}
                {change.type === "added" && "Added"}
                {change.type === "removed" && "Removed"}
              </Badge>
              <span className="text-sm font-medium">
                {formatPath(change.path)}
              </span>
            </div>

            {change.type === "changed" && (
              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-500">
                    <Minus className="h-4 w-4" />
                    <span className="text-xs font-medium">Previous</span>
                  </div>
                  <pre className="text-sm bg-red-50 p-2 rounded overflow-x-auto">
                    {formatValue(change.old_value)}
                  </pre>
                </div>
                <ArrowRight className="h-4 w-4 mt-6" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-green-500">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-medium">New</span>
                  </div>
                  <pre className="text-sm bg-green-50 p-2 rounded overflow-x-auto">
                    {formatValue(change.new_value)}
                  </pre>
                </div>
              </div>
            )}

            {change.type === "added" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-500">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">Added Value</span>
                </div>
                <pre className="text-sm bg-green-50 p-2 rounded overflow-x-auto">
                  {formatValue(change.new_value)}
                </pre>
              </div>
            )}

            {change.type === "removed" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-500">
                  <Minus className="h-4 w-4" />
                  <span className="text-xs font-medium">Removed Value</span>
                </div>
                <pre className="text-sm bg-red-50 p-2 rounded overflow-x-auto">
                  {formatValue(change.old_value)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
