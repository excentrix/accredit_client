import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TemplateManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto py-6">{children}</div>;
}
