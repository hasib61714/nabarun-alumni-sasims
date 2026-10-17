import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IMAGE_TYPES, MAX_IMAGES, VIDEO_TYPES, validateMemoryFile, type MemoryMedia } from "@/lib/memories";
import { uploadMemoryFile } from "@/lib/memory-storage";
import { MediaThumb } from "./MemoryMedia";

interface Props {
  uploaderId: string;
  value: MemoryMedia[];
  onAdd: (media: MemoryMedia) => void;
  onRemove: (media: MemoryMedia) => void;
  onBusyChange?: (busy: boolean) => void;
  /** True when a YouTube link is already set, so no video file may be added. */
  hasExternalVideo?: boolean;
  disabled?: boolean;
}

interface Pending { id: string; name: string; kind: "image" | "video" }

const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

export function MediaUploader({ uploaderId, value, onAdd, onRemove, onBusyChange, hasExternalVideo, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);

  const images = value.filter((m) => m.type === "image").length + pending.filter((p) => p.kind === "image").length;
  const videos = value.filter((m) => m.type === "video").length + pending.filter((p) => p.kind === "video").length;

  const setBusy = (next: Pending[]) => {
    setPending(next);
    onBusyChange?.(next.length > 0);
  };

  const handleFiles = async (list: FileList | File[]) => {
    let imageCount = images;
    let videoCount = videos + (hasExternalVideo ? 1 : 0);
    const accepted: { file: File; kind: "image" | "video" }[] = [];

    for (const file of Array.from(list)) {
      const problem = validateMemoryFile(file);
      if (problem) { toast.error(problem); continue; }
      const kind = IMAGE_TYPES.includes(file.type) ? "image" : "video";
      if (kind === "image" && imageCount >= MAX_IMAGES) { toast.error(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে`); continue; }
      if (kind === "video" && videoCount >= 1) { toast.error("একটি স্মৃতিতে একটিই ভিডিও দেওয়া যাবে"); continue; }
      if (kind === "image") imageCount++; else videoCount++;
      accepted.push({ file, kind });
    }
    if (accepted.length === 0) return;

    const jobs = accepted.map((a) => ({ ...a, id: crypto.randomUUID() }));
    setPending((prev) => {
      const next = [...prev, ...jobs.map((j) => ({ id: j.id, name: j.file.name, kind: j.kind }))];
      onBusyChange?.(true);
      return next;
    });

    await Promise.all(jobs.map(async (job) => {
      try {
        onAdd(await uploadMemoryFile(job.file, uploaderId));
      } catch (error) {
        toast.error(`${job.file.name}: ${error instanceof Error ? error.message : "আপলোড ব্যর্থ হয়েছে"}`);
      } finally {
        setPending((prev) => {
          const next = prev.filter((p) => p.id !== job.id);
          onBusyChange?.(next.length > 0);
          return next;
        });
      }
    }));
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring",
          dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus className="h-7 w-7 text-primary" />
        <span className="text-sm font-medium">ছবি বা ভিডিও বেছে নিন, অথবা এখানে টেনে আনুন</span>
        <span className="text-xs text-muted-foreground">
          সর্বোচ্চ {MAX_IMAGES}টি ছবি (JPG, PNG, WebP, GIF) · ১টি ভিডিও (MP4, WebM, MOV, ৫০MB পর্যন্ত)
        </span>
        <input
          ref={inputRef} type="file" multiple accept={ACCEPT} className="sr-only" disabled={disabled}
          onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ""; }}
        />
      </label>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((m) => (
            <li key={m.url} className="group relative aspect-square overflow-hidden rounded-lg border">
              <MediaThumb media={m} alt="" className="h-full w-full" />
              <button
                type="button" onClick={() => onRemove(m)} aria-label="সরিয়ে ফেলুন"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-100 transition hover:bg-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border bg-muted/50 p-2 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="line-clamp-2 text-[10px] text-muted-foreground">{p.kind === "video" ? "ভিডিও আপলোড হচ্ছে…" : p.name}</span>
            </li>
          ))}
        </ul>
      )}
      {pending.some((p) => p.kind === "video") && (
        <p className="text-xs text-muted-foreground">বড় ভিডিও আপলোডে একটু সময় লাগতে পারে — পেজ বন্ধ করবেন না।</p>
      )}
    </div>
  );
}
