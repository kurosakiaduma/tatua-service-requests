"use client";

// Client-side theme and toast providers shared by every route.
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

// Provides client-side theme and toast contexts to the application tree.
/** Wraps the application with shared client-side providers. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Toaster position="top-right" richColors closeButton />
      <>{children}</>
    </ThemeProvider>
  );
}
