// Inline navigation pending indicator shown inside a Next.js Link while a transition is in flight.
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/** Renders a fixed-size spinner that spins while the ancestor Link navigates. */
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-busy={pending}
      aria-hidden={!pending}
      className={`flex shrink-0 w-5 h-5 ${pending ? "animate-spin" : "opacity-0"}`}
    >
      <Loader2 size={14} aria-hidden="true" />
    </span>
  );
}
