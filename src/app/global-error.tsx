"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It
 * replaces the whole document, so it can't use the site's fonts, Navbar or
 * Tailwind theme. Keep it self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#FAFAF8",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.3em", fontSize: 12, color: "#C9A96E" }}>VYNL</p>
          <h1 style={{ fontWeight: 400, fontSize: 32, margin: "16px 0" }}>Something went wrong.</h1>
          <p style={{ color: "#999", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
            We&rsquo;ve been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 28px",
              background: "transparent",
              color: "#FAFAF8",
              border: "1px solid #444",
              cursor: "pointer",
              letterSpacing: "0.2em",
              fontSize: 11,
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
