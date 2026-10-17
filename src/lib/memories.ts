import { z } from "zod";
import { parseYouTube } from "@/lib/video";

export type MemoryStatus = "pending" | "approved" | "rejected";
export type MediaType = "image" | "video" | "youtube";

export interface MemoryMedia {
  type: MediaType;
  url: string;
  /** Storage path, present for files uploaded to the "memories" bucket. */
  path?: string;
}

export interface Memory {
  id: string;
  user_id: string;
  author_name: string;
  batch_year: number | null;
  title: string;
  body: string;
  category: string;
  media: MemoryMedia[];
  status: MemoryStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MEMORY_CATEGORIES = ["স্কুলজীবন", "বন্ধুত্ব", "শিক্ষক", "অনুষ্ঠান", "খেলাধুলা", "ভ্রমণ", "অন্যান্য"] as const;

export const STATUS_LABEL: Record<MemoryStatus, string> = {
  pending: "অপেক্ষমান",
  approved: "প্রকাশিত",
  rejected: "প্রত্যাখ্যাত",
};

export const MEMORY_BUCKET = "memories";
export const MAX_IMAGES = 6;
export const IMAGE_MAX_RAW_BYTES = 20 * 1024 * 1024;
export const IMAGE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

/** Only https URLs are ever rendered as media sources. */
export function safeHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Validates a file before upload. Returns a Bengali error message, or null if fine. */
export function validateMemoryFile(file: Pick<File, "type" | "size" | "name">): string | null {
  if (IMAGE_TYPES.includes(file.type)) {
    return file.size > IMAGE_MAX_RAW_BYTES ? `ছবির সাইজ ${mb(IMAGE_MAX_RAW_BYTES)}MB এর কম হতে হবে (${file.name})` : null;
  }
  if (VIDEO_TYPES.includes(file.type)) {
    return file.size > VIDEO_MAX_BYTES ? `ভিডিওর সাইজ ${mb(VIDEO_MAX_BYTES)}MB এর কম হতে হবে (${file.name})` : null;
  }
  return `এই ধরনের ফাইল আপলোড করা যাবে না (${file.name}). ছবি (JPG, PNG, WebP, GIF) বা ভিডিও (MP4, WebM, MOV) দিন।`;
}

export const coverOf = (memory: Pick<Memory, "media">): MemoryMedia | null =>
  memory.media.find((m) => m.type === "image") ?? memory.media.find((m) => m.type === "youtube") ?? memory.media[0] ?? null;

/** Normalises the jsonb column coming from the database. */
export function parseMedia(value: unknown): MemoryMedia[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): MemoryMedia[] => {
    if (!item || typeof item !== "object") return [];
    const { type, url, path } = item as Record<string, unknown>;
    if ((type === "image" || type === "video" || type === "youtube") && typeof url === "string" && safeHttpsUrl(url)) {
      return [{ type, url, ...(typeof path === "string" ? { path } : {}) }];
    }
    return [];
  });
}

export const toMemory = (row: Record<string, unknown>): Memory => ({ ...(row as unknown as Memory), media: parseMedia(row.media) });

export const memoryFormSchema = z.object({
  title: z.string().trim().min(3, "শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(150, "শিরোনাম ১৫০ অক্ষরের মধ্যে হতে হবে"),
  body: z.string().trim().min(10, "স্মৃতি কমপক্ষে ১০ অক্ষরের হতে হবে").max(5000, "স্মৃতি ৫০০০ অক্ষরের মধ্যে হতে হবে"),
  category: z.enum(MEMORY_CATEGORIES),
  batch_year: z.string().trim().regex(/^(\d{4})?$/, "সঠিক সাল লিখুন (যেমন ২০১৭)"),
  author_name: z.string().trim().max(100, "নাম ১০০ অক্ষরের মধ্যে হতে হবে").optional(),
  youtube: z.string().trim().refine((v) => !v || parseYouTube(v) !== null, "এটি সঠিক YouTube লিংক নয়"),
});
export type MemoryFormValues = z.infer<typeof memoryFormSchema>;

/** Shrinks large photos in the browser so phone pictures upload quickly. GIFs and small files are left alone. */
export async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size < 600 * 1024 || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
