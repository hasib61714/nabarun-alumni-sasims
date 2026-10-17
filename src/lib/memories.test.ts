import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coverOf, memoryFormSchema, parseMedia, publicMediaUrl, safeHttpsUrl, safeMediaUrl, validateMemoryFile, VIDEO_MAX_BYTES } from "./memories";
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

const OWNER = "123e4567-e89b-42d3-a456-426614174000";

beforeEach(() => { vi.stubEnv("VITE_SUPABASE_URL", "https://proj.supabase.co/"); });
afterEach(() => { vi.unstubAllEnvs(); });

describe("safeHttpsUrl / safeMediaUrl", () => {
  it("only lets https urls through for links", () => {
    expect(safeHttpsUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(safeHttpsUrl("http://example.com/a.jpg")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
  });
  it("allows plain http for media only on a local development server", () => {
    expect(safeMediaUrl("https://proj.supabase.co/a.png")).toBe("https://proj.supabase.co/a.png");
    expect(safeMediaUrl("http://127.0.0.1:54321/a.png")).toBe("http://127.0.0.1:54321/a.png");
    expect(safeMediaUrl("http://localhost:54321/a.png")).toBe("http://localhost:54321/a.png");
    expect(safeMediaUrl("http://evil.example/a.png")).toBeNull();
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("publicMediaUrl / parseMedia", () => {
  it("builds the address from the storage path and the project url", () => {
    expect(publicMediaUrl(`${OWNER}/a.jpg`)).toBe(`https://proj.supabase.co/storage/v1/object/public/memories/${OWNER}/a.jpg`);
  });
  it("refuses odd paths", () => {
    for (const bad of ["a.jpg", `${OWNER}/../x/a.jpg`, `${OWNER}/a b.jpg`, "x/y/z.jpg", `${OWNER}/`]) expect(publicMediaUrl(bad)).toBeNull();
  });
  it("shows uploaded files from their path and ignores whatever address was stored", () => {
    const [m] = parseMedia([{ type: "image", url: "https://evil.example/tracker.png", path: `${OWNER}/a.jpg` }]);
    expect(m.url).toBe(`https://proj.supabase.co/storage/v1/object/public/memories/${OWNER}/a.jpg`);
    expect(m.path).toBe(`${OWNER}/a.jpg`);
  });
  it("drops entries that cannot be shown safely", () => {
    expect(
      parseMedia([
        { type: "image", url: "https://x.test/a.jpg" },                 // no storage path
        { type: "video", path: `${OWNER}/../other/v.mp4` },             // path trick
        { type: "exe", path: `${OWNER}/a.exe` },                        // unknown type
        { type: "youtube", url: "https://evil.example/watch?v=dQw4w9WgXcQ" },
        "nope",
        null,
      ]),
    ).toEqual([]);
    expect(parseMedia(null)).toEqual([]);
    expect(parseMedia("[]")).toEqual([]);
  });
  it("keeps valid videos and YouTube links", () => {
    const media = parseMedia([{ type: "video", path: `${OWNER}/v.mp4` }, { type: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" }]);
    expect(media.map((m) => m.type)).toEqual(["video", "youtube"]);
  });
  it("prefers an image as the cover", () => {
    const media = parseMedia([{ type: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" }, { type: "image", path: `${OWNER}/a.jpg` }]);
    expect(coverOf({ media })?.type).toBe("image");
    expect(coverOf({ media: [] })).toBeNull();
  });
});

describe("memoryFormSchema", () => {
  const valid = { title: "প্রথম দিন", body: "স্কুলের প্রথম দিনের কথা মনে পড়ে।", category: "স্কুলজীবন", batch_year: "", youtube: "" };
  it("accepts a valid form", () => {
    expect(memoryFormSchema.safeParse(valid).success).toBe(true);
    expect(memoryFormSchema.safeParse({ ...valid, batch_year: "2017", youtube: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(true);
    const bn = memoryFormSchema.parse({ ...valid, batch_year: "২০১৭" });
    expect(bn.batch_year).toBe("2017"); // a Bangla keyboard types Bengali digits
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
