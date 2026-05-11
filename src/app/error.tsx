"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: "#fef2f2",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#991b1b", marginBottom: "10px" }}>
        Something went wrong
      </h2>
      <p style={{ color: "#7f1d1d", marginBottom: "20px" }}>
        We've logged the error and will investigate.
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
