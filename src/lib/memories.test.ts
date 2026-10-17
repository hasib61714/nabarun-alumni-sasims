import { describe, expect, it } from "vitest";
import { coverOf, memoryFormSchema, parseMedia, safeHttpsUrl, validateMemoryFile, VIDEO_MAX_BYTES } from "./memories";
import { excerpt, initialsOf } from "./format";

const file = (type: string, size: number, name = "f") => ({ type, size, name });

describe("validateMemoryFile", () => {
  it("accepts normal images and videos", () => {
    expect(validateMemoryFile(file("image/jpeg", 3 * 1024 * 1024))).toBeNull();
    expect(validateMemoryFile(file("video/mp4", 40 * 1024 * 1024))).toBeNull();
  });
  it("rejects oversized files", () => {
    expect(validateMemoryFile(file("image/png", 25 * 1024 * 1024))).toMatch(/MB/);
    expect(validateMemoryFile(file("video/webm", VIDEO_MAX_BYTES + 1))).toMatch(/MB/);
  });
  it("rejects other file types", () => {
    expect(validateMemoryFile(file("application/pdf", 10))).toBeTruthy();
    expect(validateMemoryFile(file("image/svg+xml", 10))).toBeTruthy();
    expect(validateMemoryFile(file("text/html", 10))).toBeTruthy();
  });
});

describe("safeHttpsUrl / parseMedia", () => {
  it("only lets https urls through", () => {
    expect(safeHttpsUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(safeHttpsUrl("http://example.com/a.jpg")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
  });
  it("drops malformed media entries", () => {
    expect(
      parseMedia([
        { type: "image", url: "https://x.test/a.jpg", path: "u/a.jpg" },
        { type: "image", url: "http://x.test/b.jpg" },
        { type: "exe", url: "https://x.test/c" },
        "nope",
        null,
      ]),
    ).toEqual([{ type: "image", url: "https://x.test/a.jpg", path: "u/a.jpg" }]);
    expect(parseMedia(null)).toEqual([]);
    expect(parseMedia("[]")).toEqual([]);
  });
  it("prefers an image as the cover", () => {
    const media = parseMedia([
      { type: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" },
      { type: "image", url: "https://x.test/a.jpg" },
    ]);
    expect(coverOf({ media })?.type).toBe("image");
    expect(coverOf({ media: [] })).toBeNull();
  });
});

describe("memoryFormSchema", () => {
  const valid = { title: "প্রথম দিন", body: "স্কুলের প্রথম দিনের কথা মনে পড়ে।", category: "স্কুলজীবন", batch_year: "", youtube: "" };
  it("accepts a valid form", () => {
    expect(memoryFormSchema.safeParse(valid).success).toBe(true);
    expect(memoryFormSchema.safeParse({ ...valid, batch_year: "2017", youtube: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(true);
  });
  it("rejects bad input", () => {
    expect(memoryFormSchema.safeParse({ ...valid, title: "ab" }).success).toBe(false);
    expect(memoryFormSchema.safeParse({ ...valid, body: "short" }).success).toBe(false);
    expect(memoryFormSchema.safeParse({ ...valid, body: "x".repeat(5001) }).success).toBe(false);
    expect(memoryFormSchema.safeParse({ ...valid, category: "unknown" }).success).toBe(false);
    expect(memoryFormSchema.safeParse({ ...valid, batch_year: "17" }).success).toBe(false);
    expect(memoryFormSchema.safeParse({ ...valid, youtube: "https://vimeo.com/1" }).success).toBe(false);
  });
});

describe("format helpers", () => {
  it("builds initials", () => {
    expect(initialsOf("Md. Hasibul Hasan")).toBe("MH");
    expect(initialsOf("  ")).toBe("?");
    expect(initialsOf(null, "S")).toBe("S");
  });
  it("shortens text on a word boundary", () => {
    expect(excerpt("short text", 50)).toBe("short text");
    expect(excerpt("one two three four five", 12)).toBe("one two…");
  });
});
