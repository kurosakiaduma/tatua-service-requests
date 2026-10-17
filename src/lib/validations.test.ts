import { describe, expect, it } from "vitest";
import { requestSchema, signUpSchema, statusUpdateSchema } from "./validations";

describe("request validation", () => {
  it("accepts a complete request", () => {
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "A burst pipe is flooding the road." }).success).toBe(true);
  });
  it("rejects a short description", () => {
    expect(requestSchema.safeParse({ category: "water", location: "Kilimani", description: "Too short" }).success).toBe(false);
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
});
