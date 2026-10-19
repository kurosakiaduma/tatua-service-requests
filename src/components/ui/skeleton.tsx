// Reusable loading skeleton that matches the app's muted token and pulses softly.
// Height and width are applied through inline styles because Tailwind only
// generates classes that appear as complete strings in the source.
import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  children?: ReactNode;
}

/** Renders a fixed-height pulse skeleton that reserves space for pending content. */
export function Skeleton({ className = "", height, width, children }: SkeletonProps) {
  return (
    <div
      className={["animate-pulse rounded-xl border bg-muted", className].filter(Boolean).join(" ")}
      style={{ height, width }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
