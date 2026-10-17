import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, revalidatePath, rpc, insert, upload, getUser } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  upload: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
    storage: { from: () => ({ upload }) },
    from: () => ({ insert }),
  })),
}));

import { createRequest } from "./actions";

const validForm = () => {
  const form = new FormData();
  form.set("category", "water");
  form.set("location", "Kilimani");
  form.set("description", "A burst pipe is flooding the road.");
  return form;
};

describe("createRequest server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "citizen-id" } } });
    rpc.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
  });

  it("checks the per-user limit before uploading or inserting", async () => {
    await expect(createRequest(validForm())).rejects.toThrow("REDIRECT:/dashboard?created=1");

    expect(rpc).toHaveBeenCalledWith("check_request_submission_limit");
    expect(insert).toHaveBeenCalledOnce();
    expect(upload).not.toHaveBeenCalled();
  });

  it("stops before storage when the submission limit is reached", async () => {
    rpc.mockResolvedValue({ error: new Error("You can submit at most 10 requests per hour.") });

    await expect(createRequest(validForm())).rejects.toThrow(
      "REDIRECT:/dashboard?error=You%20can%20submit%20at%20most%2010%20requests%20per%20hour."
    );

    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
