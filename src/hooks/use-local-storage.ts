"use client";

import { useEffect, useState } from "react";

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

  function setValue(value: T | ((prev: T) => T)) {
    try {
      const next = value instanceof Function ? value(stored) : value;
      setStored(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch (err) {
      console.error(`useLocalStorage [${key}]:`, err);
    }
  }

  return [stored, setValue] as const;
}
