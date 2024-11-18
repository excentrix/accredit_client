// components/ui/custom-toast.tsx
import { Toast, toast } from "react-hot-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomToastProps {
  t: Toast;
  message: string;
  type: "success" | "error" | "loading";
}

export function CustomToast({ t, message, type }: CustomToastProps) {
  return (
    <div
      className={cn(
        "flex items-center w-full max-w-md p-4 rounded-lg shadow-lg",
        t.visible ? "animate-enter" : "animate-leave",
        type === "success" && "bg-green-500",
        type === "error" && "bg-red-500",
        type === "loading" && "bg-blue-500"
      )}
    >
      {type === "success" && (
        <CheckCircle className="w-6 h-6 text-white mr-2" />
      )}
      {type === "error" && <XCircle className="w-6 h-6 text-white mr-2" />}
      {type === "loading" && (
        <Loader2 className="w-6 h-6 text-white mr-2 animate-spin" />
      )}
      <p className="text-white font-medium">{message}</p>
    </div>
  );
}
