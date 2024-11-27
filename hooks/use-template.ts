// hooks/use-template.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templateService } from "@/services";
import { queryKeys } from "@/config/query";
import { Template } from "@/types/template";
import { TemplateSchema } from "@/config/validation";

export function useTemplates(boardCode: string) {
  return useQuery({
    queryKey: queryKeys.templates.byBoard(boardCode),
    queryFn: () => templateService.getTemplates(boardCode),
    enabled: !!boardCode,
  });
}

export function useTemplate(code: string) {
  return useQuery({
    queryKey: queryKeys.templates.byCode(code),
    queryFn: () => templateService.getTemplate(code),
    enabled: !!code,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TemplateSchema) => templateService.createTemplate(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.byBoard(variables.board),
      });
    },
  });
}

export function useUpdateTemplate(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Template>) =>
      templateService.updateTemplate(code, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.byCode(code),
      });
    },
  });
}

export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => templateService.importFromExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all,
      });
    },
  });
}
