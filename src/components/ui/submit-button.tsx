// Reusable submit control that reflects server-action pending state.
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  label: string;
  pendingLabel?: string;
  className?: string;
}

/** Renders a submit button that disables and spins while its parent form action is pending. */
export function SubmitButton({
  label,
  pendingLabel = "Posting update…",
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
        "min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60",
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
