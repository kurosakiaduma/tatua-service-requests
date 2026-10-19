"use client";

// Global error fallback replacing the root layout for root-level errors.
import { useEffect } from "react";
import Link from "next/link";

// Renders a full-document error fallback for root layout errors.
export default function GlobalError({ error, reset }: { error: unknown; reset: () => void }) {
  useEffect(() => {
    console.error("Tatua global error boundary caught:", error);
  }, [error]);

  const message = error instanceof Error ? (error as Error).message : String(error);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="text-muted-foreground">{message}</p>
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
