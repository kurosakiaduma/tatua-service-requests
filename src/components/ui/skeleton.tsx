// Reusable loading skeleton that matches the app's muted token and pulses softly.
import type { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  children?: ReactNode;
}

/** Renders a fixed-height pulse skeleton that reserves space for pending content. */
export function Skeleton({ className = "", height, width = "full", children }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl border bg-muted",
        height ? `h-[${typeof height === "number" ? `${height}px` : height}]` : "h-8",
        width === "full" ? "w-full" : `w-[${typeof width === "number" ? `${width}px` : width}]`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
