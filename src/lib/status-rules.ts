// Pure client-side mirrors of database-enforced request workflow rules.
import type { Status } from "@/lib/validations";

/** Mirrors the user-facing status rules before the database performs the final check. */
export function canTransition(from: Status, to: Status, note = "") {
  if (from === "resolved" || from === "rejected") return to === "in_progress" && note.trim().length > 0;
  if (to === "rejected") return note.trim().length >= 10;
  return true;
}

/** Returns whether two reports can be linked without creating a chain or duplicate link. */
export function canLinkReport(reportId: string, originalId: string, reportDuplicateOf: string | null, originalDuplicateOf: string | null) {
  return reportId !== originalId && reportDuplicateOf === null && originalDuplicateOf === null;
}

/** Identifies statuses that require an explicit reopen action. */
export function isFinalStatus(status: Status) {
  return status === "resolved" || status === "rejected";
}
