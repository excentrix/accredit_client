// hooks/use-submission.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionService } from "@/services";
import { queryKeys } from "@/config/query";
import { SubmissionSchema } from "@/config/validation";

export function useSubmissions(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.submissions.all, filters],
    queryFn: () => submissionService.getSubmissions(filters),
  });
}

export function useSubmission(id: number) {
  return useQuery({
    queryKey: queryKeys.submissions.byId(id),
    queryFn: () => submissionService.getSubmission(id),
    enabled: !!id,
  });
}

export function useSubmissionStats() {
  return useQuery({
    queryKey: queryKeys.submissions.stats,
    queryFn: () => submissionService.getStats(),
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: queryKeys.submissions.departmentBreakdown,
    queryFn: () => submissionService.getDepartmentBreakdown(),
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmissionSchema) =>
      submissionService.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.all,
      });
    },
  });
}

export function useUpdateSubmission(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SubmissionSchema>) =>
      submissionService.updateSubmission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.byId(id),
      });
    },
  });
}

export function useSubmitSubmission(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submissionService.submitSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.byId(id),
      });
    },
  });
}

export function useApproveSubmission(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submissionService.approveSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.byId(id),
      });
    },
  });
}

export function useRejectSubmission(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) =>
      submissionService.rejectSubmission(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissions.byId(id),
      });
    },
  });
}
