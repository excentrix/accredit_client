// services/board.service.ts
import api from "@/lib/api";
import { ApiResponse, Board, AcademicYear } from "../types";

export const boardService = {
  async getBoards(): Promise<ApiResponse<Board[]>> {
    const response = await api.get<ApiResponse<Board[]>>("/boards/");
    return response.data;
  },

  async getBoard(code: string): Promise<ApiResponse<Board>> {
    const response = await api.get<ApiResponse<Board>>(`/boards/${code}/`);
    return response.data;
  },

  async getAcademicYears(): Promise<ApiResponse<AcademicYear[]>> {
    const response = await api.get<ApiResponse<AcademicYear[]>>(
      "/academic-years/"
    );
    return response.data;
  },
};
