import { TemplateFormClient } from "@/components/template-management/template-form-client";

export default function TemplateFormPage({
  params,
  searchParams,
}: {
  params: { action: string };
  searchParams: { code?: string };
}) {
  return <TemplateFormClient action={params.action} code={searchParams.code} />;
}
