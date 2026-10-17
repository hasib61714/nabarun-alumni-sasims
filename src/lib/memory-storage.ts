import { supabase } from "@/integrations/supabase/client";
import {
  IMAGE_MAX_UPLOAD_BYTES, IMAGE_TYPES, MEMORY_BUCKET, mb, prepareImage, type MemoryMedia,
} from "@/lib/memories";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

export async function uploadMemoryFile(file: File, userId: string): Promise<MemoryMedia> {
  const isImage = IMAGE_TYPES.includes(file.type);
  const prepared = isImage ? await prepareImage(file) : file;
  if (isImage && prepared.size > IMAGE_MAX_UPLOAD_BYTES) throw new Error(`ছবির সাইজ ${mb(IMAGE_MAX_UPLOAD_BYTES)}MB এর কম হতে হবে`);
  const path = `${userId}/${crypto.randomUUID()}.${EXT[prepared.type] ?? "bin"}`;
  const { error } = await supabase.storage.from(MEMORY_BUCKET).upload(path, prepared, {
    contentType: prepared.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(MEMORY_BUCKET).getPublicUrl(path);
  return { type: isImage ? "image" : "video", url: data.publicUrl, path };
}

/** Removes uploaded files from storage. Failures are non-fatal: the database row is the source of truth. */
export async function removeMemoryFiles(media: MemoryMedia[]): Promise<void> {
  const paths = media.map((m) => m.path).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from(MEMORY_BUCKET).remove(paths);
}
