"use client";

// Shared pending-state submit control used by authentication forms.
import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="min-h-12 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

/** Renders a submit button whose label changes while the server action is pending. */
export function Submit({ label }: { label: string }) {
  return <SubmitButton label={label} />;
}
