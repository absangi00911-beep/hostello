// Path: src/app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin:          0,
          minHeight:       "100dvh",
          background:      "#FDF8F0",
          fontFamily:      "system-ui, -apple-system, sans-serif",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          justifyContent:  "center",
          textAlign:       "center",
          padding:         "1.5rem",
        }}
      >
        <p
          style={{
            fontSize:    "clamp(60px, 14vw, 96px)",
            fontWeight:  800,
            color:       "#F5DFA3",
            lineHeight:  1,
            marginBottom: "1.5rem",
            letterSpacing: "-0.04em",
          }}
          aria-hidden="true"
        >
          500
        </p>

        <h1
          style={{
            fontSize:    "1.5rem",
            fontWeight:  600,
            color:       "#2A2318",
            marginBottom: "0.75rem",
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize:   "0.9375rem",
            color:      "#857060",
            maxWidth:   "36ch",
            lineHeight: 1.65,
            marginBottom: "2rem",
          }}
        >
          We&apos;ve been notified. Try again in a moment.
        </p>

        <button
          onClick={reset}
          style={{
            height:        "2.75rem",
            padding:       "0 1.5rem",
            borderRadius:  "10px",
            border:        "none",
            background:    "#2A6545",
            color:         "#F9F5EE",
            fontSize:      "0.9375rem",
            fontWeight:    500,
            cursor:        "pointer",
          }}
        >
          Reload page
        </button>
      </body>
    </html>
  );
}
