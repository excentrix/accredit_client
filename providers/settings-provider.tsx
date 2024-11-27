// providers/settings-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import api from "@/lib/api";

import { Board } from "@/types/board";
import { AcademicYear } from "@/types";

interface SettingsContextType {
  selectedBoard: string;
  setSelectedBoard: (board: string) => void;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (year: string) => void;
  boards: Board[];
  academicYears: AcademicYear[];
  isLoading: boolean;
  error: string | null;
  clearSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [selectedBoard, setSelectedBoard, clearSelectedBoard] =
    useLocalStorage<string>("selectedBoard", "naac");

  const [
    selectedAcademicYear,
    setSelectedAcademicYear,
    clearSelectedAcademicYear,
  ] = useLocalStorage<string>("selectedAcademicYear", "");

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
        setAcademicYears(yearsResponse.data.data);

        // Set current academic year if none is selected
        if (!selectedAcademicYear) {
          const currentYear = yearsResponse.data.data.find(
            (year: AcademicYear) => year.is_current
          );
          if (currentYear) {
            setSelectedAcademicYear(currentYear.id);
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
  }, [selectedAcademicYear, setSelectedAcademicYear]);

  // Add validation before setting values
  const handleSetBoard = (board: string) => {
    if (boards.some((b) => b.code === board)) {
      setSelectedBoard(board);
    }
  };

  const handleSetAcademicYear = (year: string) => {
    if (academicYears.some((y) => y.id === year)) {
      setSelectedAcademicYear(year);
    }
  };

  const clearSettings = () => {
    clearSelectedBoard();
    clearSelectedAcademicYear();
  };

  return (
    <SettingsContext.Provider
      value={{
        selectedBoard,
        setSelectedBoard: handleSetBoard,
        selectedAcademicYear,
        setSelectedAcademicYear: handleSetAcademicYear,
        boards,
        academicYears,
        isLoading,
        error,
        clearSettings,
      }}
    >
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
