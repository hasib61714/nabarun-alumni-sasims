import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { FormDialog, Field } from "@/components/common/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MEMORY_CATEGORIES, memoryFormSchema, toMemory, type Memory, type MemoryFormValues, type MemoryMedia } from "@/lib/memories";
import { removeMemoryFiles } from "@/lib/memory-storage";
import { parseYouTube, youtubeThumbnailUrl } from "@/lib/video";
import { MediaUploader } from "./MediaUploader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing memory to edit; omit to create a new one. */
  memory?: Memory | null;
  /** The signed-in user (owner when creating, uploader of new files). */
  userId: string;
  authorName?: string;
  defaultBatch?: string;
  /** Admin edit: keeps the memory's status and allows changing the author name. */
  asAdmin?: boolean;
  onSaved: (memory: Memory) => void;
}

const youtubeEntry = (media: MemoryMedia[]) => media.find((m) => m.type === "youtube");
const toFormValues = (memory: Memory | null | undefined, defaultBatch = ""): MemoryFormValues => ({
  title: memory?.title ?? "",
  body: memory?.body ?? "",
  category: (MEMORY_CATEGORIES as readonly string[]).includes(memory?.category ?? "") ? (memory!.category as MemoryFormValues["category"]) : "অন্যান্য",
  batch_year: memory?.batch_year?.toString() ?? defaultBatch,
  author_name: memory?.author_name ?? "",
  youtube: youtubeEntry(memory?.media ?? [])?.url ?? "",
});

export function MemoryFormDialog({ open, onOpenChange, memory, userId, authorName, defaultBatch, asAdmin, onSaved }: Props) {
  const form = useForm<MemoryFormValues>({ resolver: zodResolver(memoryFormSchema), defaultValues: toFormValues(memory, defaultBatch) });
  const [media, setMedia] = useState<MemoryMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const sessionUploads = useRef<MemoryMedia[]>([]);
  const saved = useRef(false);

  useEffect(() => {
    if (!open) return;
    form.reset(toFormValues(memory, defaultBatch));
    setMedia((memory?.media ?? []).filter((m) => m.type !== "youtube"));
    sessionUploads.current = [];
    saved.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memory?.id]);

  const youtubeValue = form.watch("youtube");
  const youtubeId = youtubeValue ? parseYouTube(youtubeValue) : null;
  const bodyLength = form.watch("body")?.length ?? 0;

  const handleOpenChange = (next: boolean) => {
    if (!next && !saved.current && sessionUploads.current.length) void removeMemoryFiles(sessionUploads.current);
    onOpenChange(next);
  };

  const handleRemove = (item: MemoryMedia) => {
    setMedia((prev) => prev.filter((m) => m.url !== item.url));
    if (sessionUploads.current.some((m) => m.url === item.url)) {
      sessionUploads.current = sessionUploads.current.filter((m) => m.url !== item.url);
      void removeMemoryFiles([item]); // never saved, safe to delete right away
    }
  };

  const save = async (values: MemoryFormValues) => {
    if (busy) { toast.info("ফাইল আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন"); return; }
    const ytId = values.youtube ? parseYouTube(values.youtube) : null;
    if (ytId && media.some((m) => m.type === "video")) {
      form.setError("youtube", { message: "একটি স্মৃতিতে একটিই ভিডিও দেওয়া যাবে — আপলোড করা ভিডিও অথবা YouTube লিংক" });
      return;
    }
    const finalMedia: MemoryMedia[] = [...media, ...(ytId ? [{ type: "youtube" as const, url: `https://youtu.be/${ytId}` }] : [])];
    const fields = {
      title: values.title,
      body: values.body,
      category: values.category,
      batch_year: values.batch_year ? Number(values.batch_year) : null,
      media: finalMedia as unknown as Json,
    };

    setSaving(true);
    const query = memory
      ? supabase.from("memories").update({ ...fields, ...(asAdmin && values.author_name ? { author_name: values.author_name } : {}) }).eq("id", memory.id)
      : supabase.from("memories").insert({ ...fields, user_id: userId, author_name: authorName || "অজ্ঞাত" });
    const { data, error } = await query.select().single();
    setSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "সংরক্ষণ করা যায়নি");
      return;
    }
    saved.current = true;
    // files that were removed from an existing memory are no longer referenced
    const keptUrls = new Set(finalMedia.map((m) => m.url));
    const dropped = (memory?.media ?? []).filter((m) => !keptUrls.has(m.url));
    if (dropped.length) void removeMemoryFiles(dropped);

    const result = toMemory(data);
    toast.success(
      asAdmin ? "স্মৃতি সংরক্ষিত হয়েছে" : memory ? "পরিবর্তন সংরক্ষিত হয়েছে — অ্যাডমিনের অনুমোদনের পর আবার প্রকাশিত হবে" : "স্মৃতি জমা হয়েছে — অ্যাডমিনের অনুমোদনের পর সবার জন্য প্রকাশিত হবে",
    );
    onSaved(result);
    onOpenChange(false);
  };

  const errors = form.formState.errors;

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={memory ? (asAdmin ? "স্মৃতি সম্পাদনা" : "স্মৃতি সম্পাদনা করুন") : "নতুন স্মৃতি লিখুন"}
      description={asAdmin ? "অ্যাডমিন হিসেবে সম্পাদনা — অবস্থা (status) অপরিবর্তিত থাকবে।" : "আপনার সুন্দর মুহূর্তের গল্প, ছবি বা ভিডিও সবার সাথে শেয়ার করুন।"}
      onSubmit={() => form.handleSubmit(save)()}
      submitLabel={memory ? "সংরক্ষণ করুন" : "জমা দিন"}
      loading={saving}
      wide
    >
      {!asAdmin && (
        <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>জমা দেওয়ার পর অ্যাডমিন দেখে অনুমোদন দিলে আপনার স্মৃতি “স্মৃতির পাতা”য় সবার সামনে প্রকাশিত হবে। প্রকাশিত স্মৃতি সম্পাদনা করলে আবার অনুমোদনের জন্য যাবে।</p>
        </div>
      )}

      <Field label="শিরোনাম" htmlFor="m-title" required error={errors.title?.message}>
        <Input id="m-title" maxLength={150} placeholder="যেমন: স্কুলের প্রথম দিন" {...form.register("title")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="বিভাগ" required error={errors.category?.message}>
          <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as MemoryFormValues["category"], { shouldDirty: true })}>
            <SelectTrigger aria-label="বিভাগ"><SelectValue /></SelectTrigger>
            <SelectContent>{MEMORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="ব্যাচ (SSC সাল)" htmlFor="m-batch" error={errors.batch_year?.message}>
          <Input id="m-batch" inputMode="numeric" maxLength={4} placeholder="যেমন: ২০১৭" {...form.register("batch_year")} />
        </Field>
      </div>

      {asAdmin && (
        <Field label="লেখকের নাম" htmlFor="m-author" error={errors.author_name?.message}>
          <Input id="m-author" maxLength={100} {...form.register("author_name")} />
        </Field>
      )}

      <Field label="আপনার স্মৃতি" htmlFor="m-body" required error={errors.body?.message} hint={`${bodyLength}/৫০০০`}>
        <Textarea id="m-body" rows={7} maxLength={5000} placeholder="সেদিনের কথা, বন্ধুদের কথা, শিক্ষকদের কথা… মন খুলে লিখুন।" {...form.register("body")} />
      </Field>

      <Field label="ছবি ও ভিডিও (ঐচ্ছিক)">
        <MediaUploader
          uploaderId={userId}
          value={media}
          onAdd={(m) => { sessionUploads.current.push(m); setMedia((prev) => [...prev, m]); }}
          onRemove={handleRemove}
          onBusyChange={setBusy}
          hasExternalVideo={!!youtubeId}
        />
      </Field>

      <Field label="YouTube ভিডিও লিংক (ঐচ্ছিক)" htmlFor="m-yt" error={errors.youtube?.message} hint="বড় ভিডিও YouTube-এ আপলোড করে এখানে লিংক দিন।">
        <Input id="m-yt" inputMode="url" placeholder="https://www.youtube.com/watch?v=…" {...form.register("youtube")} />
        {youtubeId && (
          <img src={youtubeThumbnailUrl(youtubeId)} alt="ভিডিওর প্রিভিউ" className="mt-2 aspect-video w-48 rounded-lg border object-cover" />
        )}
      </Field>
    </FormDialog>
  );
}
