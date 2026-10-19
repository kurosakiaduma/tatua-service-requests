// Tests for recognising external request image paths that need no signing.
import { describe, expect, it } from "vitest";
import { externalImageUrl } from "./request-image";

describe("externalImageUrl", () => {
  it("returns absolute http and https URLs unchanged", () => {
    expect(externalImageUrl("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
    expect(externalImageUrl("http://example.com/photo.jpg")).toBe("http://example.com/photo.jpg");
    expect(externalImageUrl("HTTPS://example.com/photo.jpg")).toBe("HTTPS://example.com/photo.jpg");
  });

  it("ignores private storage paths and empty values", () => {
    expect(externalImageUrl("00000000-0000-0000-0000-000000000000/photo.png")).toBeNull();
    expect(externalImageUrl("")).toBeNull();
    expect(externalImageUrl(null)).toBeNull();
    expect(externalImageUrl(undefined)).toBeNull();
    expect(externalImageUrl("ftp://example.com/photo.jpg")).toBeNull();
  });
});
