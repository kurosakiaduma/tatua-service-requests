"use client";

// Client error fallback for unexpected runtime errors, with a reset button.
import { useEffect } from "react";

// Renders an accessible error boundary fallback with a reset button.
export default function Error({ error, reset }: { error: unknown; reset: () => void }) {
  useEffect(() => {
    console.error("Tatua error boundary caught:", error);
  }, [error]);

  const message = error instanceof Error ? (error as Error).message : String(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
