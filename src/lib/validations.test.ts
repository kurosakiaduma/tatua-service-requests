import { describe, expect, it } from "vitest";
import { requestSchema, signUpSchema, statusUpdateSchema } from "./validations";
import { canTransition } from "./status-rules";

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
});
