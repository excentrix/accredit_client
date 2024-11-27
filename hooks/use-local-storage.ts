// hooks/use-local-storage.ts
import { useState, useEffect, useCallback } from "react";
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
} from "@/lib/utils/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getStorageItem<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  // Return wrapped version of useState's setter that persists new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        setStorageItem(key, valueToStore);
      } catch (error) {
        console.error(`Error saving to localStorage for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      removeStorageItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(
        `Error removing from localStorage for key "${key}":`,
        error
      );
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
