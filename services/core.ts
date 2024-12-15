// core.ts
import { SubmitOptions } from "@/context/submission-context";
import api from "./api";

export const academicYearServices = {
  fetchAcademicYears: () =>
    api.get("/api/academic-years/").then((res) => res.data),

  fetchCurrentAcademicYear: () =>
    api.get("/api/academic-years/current").then((res) => res.data),
  createAcademicYear: (data: any) =>
    api.post("/api/academic-years/", data).then((res) => res.data),
  updateAcademicYear: (id: number, data: any) =>
    api.put(`/api/academic-years/${id}/`, data).then((res) => res.data),
  deleteAcademicYear: (id: number) =>
    api.delete(`/api/academic-years/${id}/`).then((res) => res.data),
};

export const criteriaServices = {
  fetchCriteriaList: (params?: any) =>
    api.get(`/api/criteria/list/`, { params }).then((res) => {
      console.log("first", res);
      return res.data;
    }),

  fetchBoardCriteria: (boardCode: string) =>
    api.get(`/api/boards/${boardCode}/criteria/`).then((res) => res.data),
};

export const boardServices = {
  fetchBoards: () => api.get("/api/boards/").then((res) => res.data),

  fetchBoardTemplates: (boardCode: string) =>
    api.get(`/api/boards/${boardCode}/templates/`).then((res) => res.data),

  createBoard: async (data: any) => {
    const response = await api.post("/boards", data);
    return response.data;
  },

  updateBoard: async (id: number, data: any) => {
    const response = await api.put(`/boards/${id}`, data);
    return response.data;
  },

  deleteBoard: async (id: number) => {
    const response = await api.delete(`/boards/${id}`);
    return response.data;
  },
};
export const templateServices = {
  fetchTemplates: (params: any) =>
    api.get(`/api/templates/`, { params }).then((res) => res.data),

  fetchTemplate: (code: string) =>
    api.get(`/api/templates/${code}/`).then((res) => res.data),

  createTemplate: (templateData: any) =>
    api.post("/api/templates/", templateData).then((res) => res.data),

  updateTemplate: (code: string, templateData: any) =>
    api.put(`/api/templates/${code}/`, templateData).then((res) => res.data),

  deleteTemplate: (code: string) =>
    api.delete(`/api/templates/${code}/`).then((res) => res.data),

  exportTemplate: (queryParams: any) =>
    api
      .get(`/api/templates/export/?${queryParams}`, { responseType: "blob" })
      .then((res) => res.data),

  importTemplateFromExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/api/templates/import-excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },
  fetchSubmissions: (code: string) =>
    api.get(`/api/templates/${code}/submission/`).then((res) => {
      console.log("first", res);
      return res.data;
    }),
};

export const templateSubmissionServices = {
  submitTemplate: (code: string, options: SubmitOptions) =>
    api.post(`/api/templates/${code}/submit/`, options).then((res) => res.data),

  withdrawSubmission: (code: string) =>
    api.post(`/api/templates/${code}/withdraw/`).then((res) => res.data),

  approveSubmission: (code: string, departmentId: any) =>
    api
      .post(`/api/templates/${code}/approve/`, { department: departmentId })
      .then((res) => console.log("bro", res.data)),

  rejectSubmission: (
    code: string,
    departmentId: any,
    rejectionReason: string
  ) =>
    api
      .post(`/api/templates/${code}/reject/`, {
        department: departmentId,
        reason: rejectionReason,
      })
      .then((res) => res.data),
};

export const templateDataServices = {
  fetchTemplateData: (code: string) =>
    api.get(`/api/templates/${code}/data/`).then((res) => res.data),

  updateTemplateData: (code: string, data: any) =>
    api.post(`/api/templates/${code}/data/`, data).then((res) => res.data),
  updateDataRow: (code: string, rowId: number, editedData: any) =>
    api
      .put(`/api/templates/${code}/data/row/`, {
        row_id: rowId,
        data: editedData,
      })
      .then((res) => res.data),

  deleteDataRow: (code: string, rowId: number) =>
    api
      .delete(`/api/templates/${code}/data/row/?row_id=${rowId}`)
      .then((res) => res.data),
};

export const sectionDataServices = {
  fetchSectionData: (code: string, sectionIndex: number, params: any) =>
    api
      .get(`/api/templates/${code}/sections/${sectionIndex}/data/`, { params })
      .then((res) => res.data),
  createSectionData: (
    code: string,
    sectionIndex: number,
    data: any,
    params: any
  ) =>
    api
      .post(`/api/templates/${code}/sections/${sectionIndex}/data/`, data, {
        params,
      })
      .then((res) => res.data),

  updateSectionDataRow: (
    code: string,
    sectionIndex: number,
    rowId: number,
    data: any
  ) =>
    api
      .put(
        `/api/templates/${code}/sections/${sectionIndex}/data/${rowId}/`,
        data
      )
      .then((res) => res.data),
  deleteRowInSection: (code: string, sectionIndex: number, rowId: number) =>
    api
      .delete(`/api/templates/${code}/sections/${sectionIndex}/data/${rowId}/`)
      .then((res) => res.data),
};

export const submissionStatsServices = {
  fetchSubmissionStats: () =>
    api.get("/api/submissions/stats/").then((res) => res.data),

  fetchDepartmentBreakdown: (year: any) =>
    api.get("/api/submissions/department-breakdown/").then((res) => res.data),
  fetchCurrentAcademicYearSubmissions: (filters: {
    searchQuery?: string;
    statusFilter?: string;
    departmentFilter?: string;
  }) => {
    const params = new URLSearchParams();

    if (filters.searchQuery) params.append("search", filters.searchQuery);
    if (filters.statusFilter && filters.statusFilter !== "all")
      params.append("status", filters.statusFilter);
    if (filters.departmentFilter && filters.departmentFilter !== "all")
      params.append("department", filters.departmentFilter);

    // return api
    //   .get(`/api/submissions/current_academic_year/?${params.toString()}`)
    //   .then((res) => res);
    return api
      .get(`/api/submissions/current_academic_year/`)
      .then((res) => res.data);
  },
  fetchSubmissionById: (submissionId: string) =>
    api.get(`/api/submissions/${submissionId}/`).then((res) => res.data),
  approveSubmission: (submissionId: string) =>
    api
      .post(`/api/submissions/${submissionId}/approve/`)
      .then((res) => console.log("bro", res.data)),

  // Reject a submission
  rejectSubmission: (submissionId: string, reason: string) =>
    api
      .post(`/api/submissions/${submissionId}/reject/`, { reason: reason })
      .then((res) => res.data),
};

export const autocompleteServices = {
  fetchAutocompleteResults: (query: string) =>
    api
      .get("/api/autocomplete/", { params: { query } })
      .then((res) => res.data),
};

// Add to services/core.ts

export const dashboardServices = {
  // Fetch overall dashboard stats for admin and IQAC director
  fetchOverallStats: (params?: { board_id?: number; academic_year?: number }) =>
    api.get("/api/dashboard/stats/", { params }).then((res) => res.data),

  // Fetch faculty-specific dashboard stats
  fetchFacultyStats: (params?: {
    department_id?: string;
    academic_year?: number;
    board_id?: number;
  }) =>
    api
      .get("/api/dashboard/faculty-stats/", { params })
      .then((res) => res.data),

  // Fetch activity timeline data
  fetchActivityTimeline: (params?: {
    board_id?: number;
    academic_year?: number;
    department_id?: string;
    days?: number;
  }) =>
    api
      .get("/api/dashboard/activity-timeline/", { params })
      .then((res) => res.data),

  // Fetch criteria-wise completion stats
  fetchCriteriaCompletion: (params?: {
    board_id?: number;
    academic_year?: number;
  }) =>
    api
      .get("/api/dashboard/criteria-completion/", { params })
      .then((res) => res.data),

  // Fetch recent activity
  fetchRecentActivity: (params?: {
    board_id?: number;
    academic_year?: number;
    department_id?: string;
    limit?: number;
  }) =>
    api
      .get("/api/dashboard/recent-activity/", { params })
      .then((res) => res.data),

  // Fetch department summary
  fetchDepartmentSummary: (params?: {
    board_id?: number;
    academic_year?: number;
  }) =>
    api
      .get("/api/dashboard/department-summary/", { params })
      .then((res) => res.data),
};
