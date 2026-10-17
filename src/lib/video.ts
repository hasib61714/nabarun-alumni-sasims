const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

/** Returns the 11-character video id of a YouTube link, or null if it is not one. */
export function parseYouTube(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();

  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, kind, value] = url.pathname.split("/");
      if (kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") id = value ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const youtubeThumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
