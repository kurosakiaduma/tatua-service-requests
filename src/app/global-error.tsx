// Global error fallback replacing the root layout for root-level errors.
"use client";

import { useEffect } from "react";
import Link from "next/link";

const FRIENDLY_MESSAGE = "Something went wrong. Please try again.";

// Renders a full-document error fallback for root layout errors.
// The component is named ErrorPage to avoid shadowing the global Error.
export default function ErrorPage({ error, reset }: { error: unknown; reset: () => void }) {
  useEffect(() => {
    console.error("Tatua global error boundary caught:", error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error ? (error as { digest?: string }).digest : undefined;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-destructive">{FRIENDLY_MESSAGE}</h1>
        {digest && (
          <p className="text-xs text-muted-foreground">
            Reference: <span className="font-mono">{digest}</span>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </p>
      </body>
    </html>
  );
}
