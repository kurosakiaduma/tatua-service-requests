import { CircleCheck, CircleDot, CircleX, LoaderCircle } from "lucide-react";
import type { Status } from "@/lib/validations";

const config: Record<Status, { label: string; className: string; Icon: typeof CircleDot }> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning", Icon: CircleDot },
  in_progress: { label: "In progress", className: "bg-info/15 text-info", Icon: LoaderCircle },
  resolved: { label: "Resolved", className: "bg-success/15 text-success", Icon: CircleCheck },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive", Icon: CircleX },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = config[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}><Icon size={14} aria-hidden="true" />{label}</span>;
}
