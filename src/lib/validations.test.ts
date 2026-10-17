import { describe, expect, it } from "vitest";
import { requestSchema, signUpSchema, statusUpdateSchema } from "./validations";
import { canTransition } from "./status-rules";
import { canLinkReport } from "./status-rules";
import { canReplaceLocationText, coordinatesFallback } from "./location-sync";

describe("request validation", () => {
  it("accepts a complete request", () => {
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "A burst pipe is flooding the road." }).success).toBe(true);
  });
  it("rejects a short description", () => {
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "Too short" }).success).toBe(false);
  });
  it("validates coordinate ranges", () => {
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "A burst pipe is flooding the road.", latitude: -0.72, longitude: 37.15 }).success).toBe(true);
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "A burst pipe is flooding the road.", latitude: 91, longitude: 37.15 }).success).toBe(false);
  });
});

describe("account validation", () => {
  it("requires a strong enough password", () => {
    expect(signUpSchema.safeParse({ fullName: "A Citizen", email: "citizen@example.com", password: "short" }).success).toBe(false);
  });
});

describe("status validation", () => {
  it("only accepts known status values", () => {
    expect(statusUpdateSchema.safeParse({ requestId: crypto.randomUUID(), status: "resolved" }).success).toBe(true);
    expect(statusUpdateSchema.safeParse({ requestId: crypto.randomUUID(), status: "closed" }).success).toBe(false);
  });
  it("requires a reason when rejecting or reopening a final request", () => {
    expect(canTransition("pending", "rejected", "Too short")).toBe(false);
    expect(canTransition("pending", "rejected", "This is already being tracked elsewhere.")).toBe(true);
    expect(canTransition("resolved", "in_progress", "")).toBe(false);
    expect(canTransition("resolved", "in_progress", "The issue has returned and needs review.")).toBe(true);
  });
  it("allows only unlinked reports to link to primary requests", () => {
    expect(canLinkReport("report", "original", null, null)).toBe(true);
    expect(canLinkReport("report", "original", "other", null)).toBe(false);
    expect(canLinkReport("report", "original", null, "other")).toBe(false);
    expect(canLinkReport("same", "same", null, null)).toBe(false);
  });
});

describe("location synchronization", () => {
  it("does not overwrite typed text", () => {
    expect(canReplaceLocationText("Citizen supplied this", false)).toBe(false);
    expect(canReplaceLocationText("", false)).toBe(true);
    expect(canReplaceLocationText("Previous pin", true)).toBe(true);
  });
  it("provides a readable coordinate fallback", () => {
    expect(coordinatesFallback([-0.72, 37.15])).toBe("Pinned location (-0.72000, 37.15000)");
  });
});
