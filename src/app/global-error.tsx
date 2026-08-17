// Path: src/app/global-error.tsx
"use client";

export default function GlobalError({
  error: _error,
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
          background:      "#f8f9fa",
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
            color:       "#ff6b6b",
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
            color:       "#191c1d",
            marginBottom: "0.75rem",
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize:   "0.9375rem",
            color:      "#584140",
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
            borderRadius:  "8px",
            border:        "none",
            background:    "#ae2f34",
            color:         "#ffffff",
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
