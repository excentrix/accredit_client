// services/template.service.ts
import api from "@/lib/api";
import { ApiResponse, Template, TemplateSchema, TemplateSectionDataSchema } from "../types";

export const templateService = {
  async getTemplates(boardCode: string): Promise<ApiResponse<Template[]>> {
    const response = await api.get<ApiResponse<Template[]>>("/templates/", {
      params: { board: boardCode },
    });
    return response.data;
  },

  async getTemplate(code: string): Promise<ApiResponse<Template>> {
    const response = await api.get<ApiResponse<Template>>(
      `/templates/${code}/`
    );
    return response.data;
  },

  async createTemplate(data: TemplateSchema): Promise<ApiResponse<Template>> {
    const response = await api.post<ApiResponse<Template>>("/templates/", data);
    return response.data;
  },

  async updateTemplate(
    code: string,
    data: Partial<TemplateSchema>
  ): Promise<ApiResponse<Template>> {
    const response = await api.patch<ApiResponse<Template>>(
      `/templates/${code}/`,
      data
    );
    return response.data;
  },

  async deleteTemplate(code: string): Promise<void> {
    await api.delete(`/templates/${code}/`);
  },

  async importFromExcel(file: File): Promise<ApiResponse<{ message: string }>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<{ message: string }>>(
      "/templates/import-excel/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async exportTemplate(code: string): Promise<Blob> {
    const response = await api.get(`/templates/${code}/export/`, {
      responseType: "blob",
    });
    return response.data;
  },

  async getSectionData(
    templateCode: string,
    sectionIndex: number
  ): Promise<ApiResponse<any>> {
    const response = await api.get(
      `/templates/${templateCode}/sections/${sectionIndex}/data/`
    );
    return response.data;
  },

  async saveSectionData(
    templateCode: string,
    sectionIndex: number,
    data: TemplateSectionDataSchema
  ): Promise<ApiResponse<any>> {
    const response = await api.post(
      `/templates/${templateCode}/sections/${sectionIndex}/data/`,
      data
    );
    return response.data;
  },
};
