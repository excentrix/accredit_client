// context/settings-context.tsx
"use client";
import { useAuth } from "@/context/use-auth-context";
import React, { createContext, useContext, useEffect, useState } from "react";

import { AcademicYear } from "@/types/academic-year";
import { Board } from "@/types/board";
import { useRouter } from "next/navigation";
import api from "@/services/api";
// import localStorage from "local-";

interface SettingsContextType {
  selectedBoard: number;
  setSelectedBoard: (boardId: number) => void;
  selectedAcademicYear: number;
  setSelectedAcademicYear: (yearId: number) => void;
  boards: Board[];
  academicYears: AcademicYear[];
  isLoading: boolean;
  error: string | null;
  currentBoard?: Board;
  currentAcademicYear?: AcademicYear;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const STORAGE_KEYS = {
  SELECTED_BOARD: "selected_board",
  SELECTED_ACADEMIC_YEAR: "selected_academic_year",
} as const;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // const [selectedBoard, setSelectedBoard] = useState<number>(() => {
  //   const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_BOARD);
  //   return stored ? parseInt(stored, 10) : 1;
  // });

  // const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(
  //   () => {
  //     const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
  //     return stored ? parseInt(stored, 10) : 0;
  //   }
  // );

  const [selectedBoard, setSelectedBoard] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(0);
  const [boards, setBoards] = useState<Board[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const router = useRouter();

  // Client-side only localStorage access
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedBoard = localStorage.getItem(STORAGE_KEYS.SELECTED_BOARD);
      const storedYear = localStorage.getItem(
        STORAGE_KEYS.SELECTED_ACADEMIC_YEAR
      );

      if (storedBoard) {
        setSelectedBoard(parseInt(storedBoard, 10));
      }
      if (storedYear) {
        setSelectedAcademicYear(parseInt(storedYear, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [boardsResponse, yearsResponse] = await Promise.all([
          api.get("/api/boards/"),
          api.get("/api/academic-years/"),
        ]);

        setBoards(boardsResponse.data);
        setAcademicYears(yearsResponse.data.data);
      } catch (error) {
        console.error("Failed to fetch initial settings data:", error);
        setError("Failed to load settings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, selectedBoard, selectedAcademicYear]);

  useEffect(() => {
    if (academicYears.length > 0) {
      if (
        selectedAcademicYear &&
        !academicYears.some((y: AcademicYear) => y.id === selectedAcademicYear)
      ) {
        // If invalid, fallback to the first available academic year
        const defaultYear = academicYears[0];
        if (defaultYear) {
          handleSetAcademicYear(defaultYear.id);
        }
      } else if (!selectedAcademicYear) {
        // Set current year if no academic year is selected
        const currentYear = academicYears.find(
          (year: AcademicYear) => year.is_current
        );
        if (currentYear) {
          handleSetAcademicYear(currentYear.id);
        }
      }
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (boards.length > 0) {
      // Ensure that selected board is valid
      if (
        selectedBoard &&
        !boards.some((board: Board) => board.id === selectedBoard)
      ) {
        // If invalid, fallback to the first available board

        const defaultBoard = boards[0];
        if (defaultBoard) {
          handleSetBoard(defaultBoard.id);
        }
      } else if (!selectedBoard) {
        // If no board selected, set the first available one
        const defaultBoard = boards[0];
        if (defaultBoard) {
          handleSetBoard(defaultBoard.id);
        }
      }
    }
  }, [boards, selectedBoard]);

  const handleSetBoard = (boardId: number) => {
    if (boards.find((b) => b.id === boardId)) {
      setSelectedBoard(boardId);

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SELECTED_BOARD, boardId.toString());
      }
    } else {
      console.warn(`Invalid board ID: ${boardId}`);
    }
  };

  const handleSetAcademicYear = (yearId: number) => {
    if (academicYears.find((y) => y.id === yearId)) {
      setSelectedAcademicYear(yearId);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEYS.SELECTED_ACADEMIC_YEAR,
          yearId.toString()
        );
      }
    } else {
      console.warn(`Invalid academic year ID: ${yearId}`);
    }
  };

  // Get current board and academic year objects
  const currentBoard = boards.find((b) => b.id === selectedBoard) || boards[0];
  const currentAcademicYear =
    academicYears.find((y) => y.id === selectedAcademicYear) ||
    academicYears[0];

  const value = React.useMemo(
    () => ({
      selectedBoard,
      setSelectedBoard: handleSetBoard,
      selectedAcademicYear,
      setSelectedAcademicYear: handleSetAcademicYear,
      boards,
      academicYears,
      isLoading,
      error,
      currentBoard,
      currentAcademicYear,
    }),
    [
      selectedBoard,
      selectedAcademicYear,
      boards,
      academicYears,
      isLoading,
      error,
      currentBoard,
      currentAcademicYear,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function useResetSettings() {
  const { setSelectedBoard, setSelectedAcademicYear, boards } = useSettings();

  return React.useCallback(() => {
    const defaultBoard = boards[0];
    if (defaultBoard) {
      setSelectedBoard(defaultBoard.id);
    }
    setSelectedAcademicYear(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_BOARD);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
    }
  }, [setSelectedBoard, setSelectedAcademicYear, boards]);
}
