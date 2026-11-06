export type AlertStatus = "ACTIVE" | "PAUSED" | "EXPIRED";

export type AlertRecord = {
  id: string;
  type: "HOSTEL" | "SEARCH";
  hostelName?: string | null;
  criteria: Record<string, unknown>;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: AlertStatus;
  isMatched: boolean;
};
