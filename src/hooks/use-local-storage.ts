"use client";

import { useEffect, useState, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(next));
        }
        return next;
      });
    } catch (err) {
      console.error(`useLocalStorage [${key}]:`, err);
    }
  }, [key]);

  return [stored, setValue] as const;
}
