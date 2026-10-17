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

/**
 * Removes uploaded files from storage. Only files inside `ownerId`'s folder are touched, so a
 * memory that was tampered with to point at someone else's file can never delete it.
 * Failures are non-fatal: the database row is the source of truth.
 */
export async function removeMemoryFiles(media: MemoryMedia[], ownerId: string): Promise<void> {
  const paths = media.map((m) => m.path).filter((p): p is string => !!p && p.startsWith(`${ownerId}/`));
  if (paths.length) await supabase.storage.from(MEMORY_BUCKET).remove(paths);
}

/** Deletes every file a person uploaded (used when their account is removed). Best effort. */
export async function removeUserMemoryFolder(userId: string): Promise<void> {
  try {
    const { data } = await supabase.storage.from(MEMORY_BUCKET).list(userId, { limit: 1000 });
    const paths = (data ?? []).filter((f) => f.name).map((f) => `${userId}/${f.name}`);
    if (paths.length) await supabase.storage.from(MEMORY_BUCKET).remove(paths);
  } catch {
    /* the account removal must not fail because of cleanup */
  }
}
