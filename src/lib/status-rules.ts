import type { Status } from "@/lib/validations";

export function canTransition(from: Status, to: Status, note = "") {
  if (from === "resolved" || from === "rejected") return to === "in_progress" && note.trim().length > 0;
  if (to === "rejected") return note.trim().length >= 10;
  return true;
}

export function canLinkReport(reportId: string, originalId: string, reportDuplicateOf: string | null, originalDuplicateOf: string | null) {
  return reportId !== originalId && reportDuplicateOf === null && originalDuplicateOf === null;
}

export function isFinalStatus(status: Status) {
  return status === "resolved" || status === "rejected";
}
