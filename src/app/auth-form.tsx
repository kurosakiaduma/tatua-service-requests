"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{pending ? "Working..." : label}</button>;
}

export function Submit({ label }: { label: string }) {
  return <SubmitButton label={label} />;
}
