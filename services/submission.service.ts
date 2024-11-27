// services/submission.service.ts
import api from "@/lib/api";
import { ApiResponse, SubmissionState, SubmissionSchema } from "../types";

export const submissionService = {
  async getSubmissions(
    filters?: Record<string, any>
  ): Promise<ApiResponse<SubmissionState[]>> {
    const response = await api.get<ApiResponse<SubmissionState[]>>(
      "/submissions/",
      {
        params: filters,
      }
    );
    return response.data;
  },

  async getSubmission(id: number): Promise<ApiResponse<SubmissionState>> {
    const response = await api.get<ApiResponse<SubmissionState>>(
      `/submissions/${id}/`
    );
    return response.data;
  },

  async createSubmission(
    data: SubmissionSchema
  ): Promise<ApiResponse<SubmissionState>> {
    const response = await api.post<ApiResponse<SubmissionState>>(
      "/submissions/",
      data
    );
    return response.data;
  },

  async updateSubmission(
    id: number,
    data: Partial<SubmissionSchema>
  ): Promise<ApiResponse<SubmissionState>> {
    const response = await api.patch<ApiResponse<SubmissionState>>(
      `/submissions/${id}/`,
      data
    );
    return response.data;
  },

  async submitSubmission(id: number): Promise<ApiResponse<SubmissionState>> {
    const response = await api.post<ApiResponse<SubmissionState>>(
      `/submissions/${id}/submit/`
    );
    return response.data;
  },

  async approveSubmission(id: number): Promise<ApiResponse<SubmissionState>> {
    const response = await api.post<ApiResponse<SubmissionState>>(
      `/submissions/${id}/approve/`
    );
    return response.data;
  },

  async rejectSubmission(
    id: number,
    reason: string
  ): Promise<ApiResponse<SubmissionState>> {
    const response = await api.post<ApiResponse<SubmissionState>>(
      `/submissions/${id}/reject/`,
      {
        reason,
      }
    );
    return response.data;
  },

  async withdrawSubmission(id: number): Promise<ApiResponse<SubmissionState>> {
    const response = await api.post<ApiResponse<SubmissionState>>(
      `/submissions/${id}/withdraw/`
    );
    return response.data;
  },

  async getStats(): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>("/submissions/stats/");
    return response.data;
  },

  async getDepartmentBreakdown(): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(
      "/submissions/department-breakdown/"
    );
    return response.data;
  },
};
