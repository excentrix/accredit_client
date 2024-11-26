// context/settings-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { AcademicYear } from "@/types/academic-year";
import { Board } from "@/types/board";
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

const STORAGE_KEYS = {
  SELECTED_BOARD: "selected_board",
  SELECTED_ACADEMIC_YEAR: "selected_academic_year",
} as const;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [selectedBoard, setSelectedBoard] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_BOARD);
    return stored ? parseInt(stored, 10) : 1;
  });

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(
    () => {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
      return stored ? parseInt(stored, 10) : 0;
    }
  );

  const [boards, setBoards] = useState<Board[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [boardsResponse, yearsResponse] = await Promise.all([
          api.get("/boards/"),
          api.get("/academic-years/"),
        ]);

        setBoards(boardsResponse.data);
        console.log("boards", boardsResponse.data);
        setAcademicYears(yearsResponse.data.data);

        // Only set current academic year if no year is selected
        if (!selectedAcademicYear) {
          const currentYear = yearsResponse.data.data.find(
            (year: AcademicYear) => year.is_current
          );
          if (currentYear) {
            handleSetAcademicYear(currentYear.id);
          }
        }

        // Set default board if current selection is invalid
        if (
          !boardsResponse.data.some((board: any) => board.id === selectedBoard)
        ) {
          const defaultBoard = boardsResponse.data[0];
          if (defaultBoard) {
            handleSetBoard(defaultBoard.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial settings data:", error);
        setError("Failed to load settings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSetBoard = (boardId: number) => {
    if (boards.some((b) => b.id === boardId)) {
      setSelectedBoard(boardId);
      localStorage.setItem(STORAGE_KEYS.SELECTED_BOARD, boardId.toString());
    } else {
      console.warn(`Invalid board ID: ${boardId}`);
    }
  };

  const handleSetAcademicYear = (yearId: number) => {
    if (academicYears.some((y) => y.id === yearId)) {
      setSelectedAcademicYear(yearId);
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_ACADEMIC_YEAR,
        yearId.toString()
      );
    } else {
      console.warn(`Invalid academic year ID: ${yearId}`);
    }
  };

  // Get current board and academic year objects
  const currentBoard = boards.find((b) => b.id === selectedBoard);
  const currentAcademicYear = academicYears.find(
    (y) => y.id === selectedAcademicYear
  );

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
    localStorage.removeItem(STORAGE_KEYS.SELECTED_BOARD);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
  }, [setSelectedBoard, setSelectedAcademicYear, boards]);
}
