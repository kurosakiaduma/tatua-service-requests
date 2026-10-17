"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{pending ? "Working..." : label}</button>;
}

export function Submit({ label }: { label: string }) {
  return <SubmitButton label={label} />;
}
