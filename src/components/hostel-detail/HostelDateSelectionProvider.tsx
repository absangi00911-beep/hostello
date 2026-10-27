"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HostelDateSelection {
  checkIn: string;
  checkOut: string;
  setMoveIn: (value: string) => void;
  setMoveOut: (value: string) => void;
  selectMoveIn: (value: string) => void;
}

const HostelDateSelectionContext =
  createContext<HostelDateSelection | null>(null);

export function HostelDateSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  function setMoveIn(value: string) {
    setCheckIn(value);
    setCheckOut((current) => (current && current <= value ? "" : current));
  }

  function selectMoveIn(value: string) {
    setCheckIn(value);
    setCheckOut("");
  }

  return (
    <HostelDateSelectionContext.Provider
      value={{
        checkIn,
        checkOut,
        setMoveIn,
        setMoveOut: setCheckOut,
        selectMoveIn,
      }}
    >
      {children}
    </HostelDateSelectionContext.Provider>
  );
}

export function useHostelDateSelection() {
  const selection = useContext(HostelDateSelectionContext);
  if (!selection) {
    throw new Error(
      "Hostel date selection must be used within its provider.",
    );
  }

  return selection;
}
