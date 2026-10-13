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
          background:      "var(--color-bg-page, #f6f2eb)",
          color:           "var(--color-text-body, #303936)",
          fontFamily:      "var(--font-body, system-ui, -apple-system, sans-serif)",
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
            fontWeight:  700,
            color:       "var(--color-primary, #0066ff)",
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
            fontFamily:  "var(--font-display, system-ui, sans-serif)",
            fontSize:    "1.5rem",
            fontWeight:  400,
            color:       "var(--color-text-heading, #222b29)",
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize:   "0.9375rem",
            color:      "var(--color-text-muted, #626a65)",
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
            borderRadius:  "var(--radius-md, 10px)",
            border:        "none",
            background:    "var(--color-action, #0052cc)",
            color:         "var(--color-text-inverse, #fffaf3)",
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
