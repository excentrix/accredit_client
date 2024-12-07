// utils/api-wrapper.ts
import { STORAGE_KEYS } from "@/context/settings-context";

// Helper function to get settings from localStorage
const getSettings = () => {
  const boardId = localStorage.getItem(STORAGE_KEYS.SELECTED_BOARD);
  const academicYearId = localStorage.getItem(
    STORAGE_KEYS.SELECTED_ACADEMIC_YEAR
  );
  return {
    board: boardId ? parseInt(boardId, 10) : undefined,
    academic_year: academicYearId ? parseInt(academicYearId, 10) : undefined,
  };
};

// Function to determine if an endpoint needs settings
export const needsSettings = (url: string) => {
  const excludedPaths = [
    "/user/token",
    "/user/token/refresh",
    "/user/logout",
    "/user/users/me",
    "/api/boards",
    "/api/academic-years",
    "/api/templates/export/",
    // "/api/submissions/current_academic_year/",
    // Add other paths that don't need settings
  ];
  return !excludedPaths.some((path) => url.includes(path));
};

// Wrapper for GET requests
export const withSettings = async (apiCall: () => Promise<any>) => {
  try {
    const settings = getSettings();
    return await apiCall();
  } catch (error) {
    // Handle any settings-related errors
    throw error;
  }
};
