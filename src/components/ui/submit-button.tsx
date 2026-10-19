"use client";

// Reusable submit control that reflects server-action pending state.
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "destructive-outline";
  className?: string;
}

// Fixed class sets per variant. tailwind-merge is not installed, so each
// variant carries its complete background/border utilities to avoid relying on
// className overrides to override conflicting utilities such as bg-primary.
const VARIANT_CLASSES: Record<string, string> = {
  primary:
    "min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60",
  secondary:
    "min-h-12 rounded-lg bg-secondary px-5 py-3 font-semibold text-secondary-foreground hover:bg-accent disabled:opacity-60",
  outline:
    "min-h-12 rounded-xl border px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60",
  "destructive-outline":
    "min-h-12 rounded-lg border border-destructive bg-transparent px-5 py-3 font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60",
};

/** Renders a submit button that disables and spins while its parent form action is pending. */
export function SubmitButton({
  label,
  pendingLabel = "Working…",
  variant = "primary",
  className,
  ...props
}: SubmitButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={[
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
        "cursor-pointer disabled:cursor-wait",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="mr-2 -mt-0.5 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
