// Tests for the client-side mirrors of database-enforced request workflow rules.
import { describe, expect, it } from "vitest";
import { canTransition, canLinkReport, isFinalStatus } from "./status-rules";

describe("canTransition", () => {
  it("allows ordinary status changes without a note", () => {
    expect(canTransition("pending", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "resolved")).toBe(true);
    expect(canTransition("in_progress", "rejected", "A clear reason here.")).toBe(true);
  });

  it("allows reopening only final statuses with a non-empty note", () => {
    expect(canTransition("resolved", "in_progress", "The issue has returned.")).toBe(true);
    expect(canTransition("rejected", "in_progress", "Reviewing the issue again.")).toBe(true);
    expect(canTransition("resolved", "in_progress", "")).toBe(false);
    expect(canTransition("rejected", "in_progress", "   ")).toBe(false);
  });

  it("does not allow reopening to any status other than in progress", () => {
    expect(canTransition("resolved", "pending")).toBe(false);
    expect(canTransition("rejected", "pending")).toBe(false);
    expect(canTransition("resolved", "rejected")).toBe(false);
    expect(canTransition("rejected", "resolved")).toBe(false);
  });

  it("requires a rejection reason of at least ten characters", () => {
    expect(canTransition("pending", "rejected", "Too short")).toBe(false);
    expect(canTransition("in_progress", "rejected", "Duplicate of an earlier report.")).toBe(true);
    expect(canTransition("pending", "rejected", "Exactly ten chars!")).toBe(true);
  });
});

describe("canLinkReport", () => {
  it("allows linking an unlinked report to a primary request", () => {
    expect(canLinkReport("report", "original", null, null)).toBe(true);
  });

  it("blocks linking a report to itself", () => {
    expect(canLinkReport("same", "same", null, null)).toBe(false);
  });

  it("blocks linking a report that is already linked", () => {
    expect(canLinkReport("report", "original", "other", null)).toBe(false);
  });

  it("blocks linking to an original that is already linked", () => {
    expect(canLinkReport("report", "original", null, "other")).toBe(false);
  });

  it("blocks chains and duplicate links", () => {
    expect(canLinkReport("report", "original", "other", "another")).toBe(false);
  });
});

describe("isFinalStatus", () => {
  it("identifies resolved and rejected as final", () => {
    expect(isFinalStatus("resolved")).toBe(true);
    expect(isFinalStatus("rejected")).toBe(true);
  });

  it("identifies pending and in progress as not final", () => {
    expect(isFinalStatus("pending")).toBe(false);
    expect(isFinalStatus("in_progress")).toBe(false);
  });
});
