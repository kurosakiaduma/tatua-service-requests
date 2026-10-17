import { CircleCheck, CircleDot, LoaderCircle } from "lucide-react";
import type { Status } from "@/lib/validations";

const config: Record<Status, { label: string; className: string; Icon: typeof CircleDot }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-800", Icon: CircleDot },
  in_progress: { label: "In progress", className: "bg-blue-50 text-blue-800", Icon: LoaderCircle },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-800", Icon: CircleCheck },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = config[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}><Icon size={14} aria-hidden="true" />{label}</span>;
}
