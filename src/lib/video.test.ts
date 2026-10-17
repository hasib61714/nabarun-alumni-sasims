import { describe, expect, it } from "vitest";
import { parseYouTube, youtubeEmbedUrl } from "./video";

describe("parseYouTube", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `youtube.com/watch?v=${id}`,
    `  https://youtu.be/${id}  `,
  ])("extracts the id from %s", (url) => {
    expect(parseYouTube(url)).toBe(id);
  });

  it.each([
    "", "   ", "hello", "https://vimeo.com/12345",
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch",
    "javascript:alert(1)",
    "https://youtu.be/",
  ])("rejects %j", (value) => {
    expect(parseYouTube(value)).toBeNull();
  });

  it("builds a privacy-friendly embed url", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  });
});
