import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { IMAGE_MAX_RAW_BYTES, IMAGE_TYPES, prepareImage, safeHttpsUrl } from "@/lib/memories";
import { ActionButton, ListSkeleton, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

type Photo = Row<"gallery_photos">;

const metaSchema = z.object({
  title: z.string().trim().max(150),
  description: z.string().trim().max(1000),
  event_name: z.string().trim().max(150),
  batch_year: z.string().trim().regex(/^(\d{4})?$/, "সঠিক সাল লিখুন"),
});
type Meta = z.infer<typeof metaSchema>;

const storagePathOf = (url: string) => url.split("/gallery/")[1];

function UploadDialog({ open, adminId, onClose }: { open: boolean; adminId: string; onClose: () => void }) {
  const { create } = useRowMutations("gallery_photos");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const form = useForm<Meta>({ resolver: zodResolver(metaSchema), defaultValues: { title: "", description: "", event_name: "", batch_year: "" } });
  const errors = form.formState.errors;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  useEffect(() => { if (open) { setFiles([]); setProgress(null); form.reset(); } }, [open, form]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok = Array.from(list).filter((f) => {
      if (!IMAGE_TYPES.includes(f.type)) { toast.error(`${f.name}: শুধু ছবি দিন`); return false; }
      if (f.size > IMAGE_MAX_RAW_BYTES) { toast.error(`${f.name}: ২০MB এর কম হতে হবে`); return false; }
      return true;
    });
    setFiles((prev) => [...prev, ...ok].slice(0, 20));
  };

  const save = form.handleSubmit(async (v) => {
    if (files.length === 0) { toast.error("অন্তত একটি ছবি বেছে নিন"); return; }
    if (files.length === 1 && !v.title) { form.setError("title", { message: "শিরোনাম দিন" }); return; }
    let done = 0;
    setProgress(0);
    for (const file of files) {
      try {
        const prepared = await prepareImage(file);
        const ext = prepared.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("gallery").upload(path, prepared, { contentType: prepared.type });
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from("gallery").getPublicUrl(path);
        await create.mutateAsync({
          title: v.title || file.name.replace(/\.\w+$/, ""), description: v.description || null, event_name: v.event_name || null,
          batch_year: v.batch_year ? Number(v.batch_year) : null, photo_url: data.publicUrl, uploaded_by: adminId, is_published: true,
        });
        done++;
        setProgress(done);
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "আপলোড ব্যর্থ"}`);
      }
    }
    setProgress(null);
    if (done > 0) toast.success(`${done}টি ছবি যুক্ত হয়েছে`);
    if (done === files.length) onClose();
    else setFiles((prev) => prev.slice(done));
  });

  return (
    <FormDialog open={open} onOpenChange={(o) => !o && onClose()} title="গ্যালারিতে ছবি যোগ করুন" description="একসাথে একাধিক ছবি দেওয়া যাবে। ছবি আপলোডের সময় স্বয়ংক্রিয়ভাবে ছোট করা হয়।" onSubmit={() => save()} loading={progress !== null} submitLabel={progress !== null ? `আপলোড হচ্ছে ${progress}/${files.length}` : "আপলোড করুন"} wide>
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-primary/60 hover:bg-primary/5">
        <ImagePlus className="h-7 w-7 text-primary" />
        <span className="text-sm font-medium">ছবি বেছে নিন</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF · সর্বোচ্চ ২০টি</span>
        <input type="file" multiple accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </label>
      {previews.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {previews.map((src, i) => (
            <li key={src} className="group relative aspect-square overflow-hidden rounded-lg border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button type="button" aria-label="সরান" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
      <Field label={files.length > 1 ? "শিরোনাম (ঐচ্ছিক — না দিলে ফাইলের নাম)" : "শিরোনাম"} required={files.length <= 1} error={errors.title?.message}><Input maxLength={150} {...form.register("title")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ইভেন্টের নাম" error={errors.event_name?.message}><Input {...form.register("event_name")} /></Field>
        <Field label="ব্যাচ" error={errors.batch_year?.message}><Input inputMode="numeric" maxLength={4} {...form.register("batch_year")} /></Field>
      </div>
      <Field label="বিবরণ" error={errors.description?.message}><Textarea rows={2} {...form.register("description")} /></Field>
    </FormDialog>
  );
}

const editSchema = metaSchema.extend({ title: z.string().trim().min(1, "শিরোনাম দিন").max(150), is_published: z.boolean() });
type EditValues = z.infer<typeof editSchema>;

function EditDialog({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const { update } = useRowMutations("gallery_photos");
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: photo ? { title: photo.title, description: photo.description ?? "", event_name: photo.event_name ?? "", batch_year: photo.batch_year?.toString() ?? "", is_published: !!photo.is_published } : undefined,
  });
  const errors = form.formState.errors;
  const save = form.handleSubmit(async (v) => {
    if (!photo) return;
    const ok = await attempt(update.mutateAsync({ id: photo.id, values: { title: v.title, description: v.description || null, event_name: v.event_name || null, batch_year: v.batch_year ? Number(v.batch_year) : null, is_published: v.is_published } }), "ছবির তথ্য সংরক্ষিত হয়েছে");
    if (ok) onClose();
  });
  const src = safeHttpsUrl(photo?.photo_url);
  return (
    <FormDialog open={!!photo} onOpenChange={(o) => !o && onClose()} title="ছবির তথ্য সম্পাদনা" onSubmit={() => save()} loading={update.isPending}>
      {src && <img src={src} alt="" className="mx-auto max-h-48 rounded-lg border object-contain" />}
      <Field label="শিরোনাম" required error={errors.title?.message}><Input maxLength={150} {...form.register("title")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ইভেন্টের নাম" error={errors.event_name?.message}><Input {...form.register("event_name")} /></Field>
        <Field label="ব্যাচ" error={errors.batch_year?.message}><Input inputMode="numeric" maxLength={4} {...form.register("batch_year")} /></Field>
      </div>
      <Field label="বিবরণ" error={errors.description?.message}><Textarea rows={3} {...form.register("description")} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">প্রকাশিত</span><Switch checked={form.watch("is_published")} onCheckedChange={(c) => form.setValue("is_published", c, { shouldDirty: true })} /></label>
    </FormDialog>
  );
}

export default function GallerySection({ adminId }: { adminId: string }) {
  const confirm = useConfirm();
  const { data: photos = [], isLoading } = useAdminRows("gallery_photos", "created_at");
  const { update, remove } = useRowMutations("gallery_photos");
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return photos.filter((p) => !q || `${p.title} ${p.event_name ?? ""} ${p.description ?? ""}`.toLowerCase().includes(q));
  }, [photos, search]);

  const destroy = async (p: Photo) => {
    if (!(await confirm({ title: "ছবিটি মুছে ফেলবেন?", description: `“${p.title}” গ্যালারি থেকে স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true }))) return;
    if (await attempt(remove.mutateAsync(p.id), "ছবি মুছে ফেলা হয়েছে")) {
      const path = storagePathOf(p.photo_url);
      if (path) void supabase.storage.from("gallery").remove([path]);
    }
  };

  return (
    <div>
      <SectionHeader title="ফটো গ্যালারি" description={`মোট ${photos.length}টি ছবি`} actions={<Button className="gap-2" onClick={() => setUploading(true)}><Plus className="h-4 w-4" /> ছবি যোগ করুন</Button>} />
      {photos.length > 0 && <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="শিরোনাম বা ইভেন্ট দিয়ে খুঁজুন…" /></Toolbar>}
      {isLoading ? <ListSkeleton /> : photos.length === 0 ? (
        <EmptyState icon={Images} title="গ্যালারি এখনো খালি" description="অনুষ্ঠান ও স্মৃতির ছবি আপলোড করুন।" action={<Button onClick={() => setUploading(true)} className="gap-2"><Plus className="h-4 w-4" /> ছবি যোগ করুন</Button>} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Images} title="কোনো ছবি পাওয়া যায়নি" description="অন্য শব্দে খুঁজে দেখুন।" />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <article key={p.id} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
              <div className="relative aspect-[4/3] bg-muted">
                {safeHttpsUrl(p.photo_url) && <img src={p.photo_url} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                <StatusBadge tone={p.is_published ? "approved" : "neutral"} label={p.is_published ? "প্রকাশিত" : "অপ্রকাশিত"} className="absolute left-2 top-2 shadow-sm" />
              </div>
              <div className="flex-1 p-3">
                <h3 className="font-medium leading-snug line-clamp-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{[p.event_name, p.batch_year ? `ব্যাচ ${p.batch_year}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <div className="flex items-center gap-1 border-t px-2 py-1.5">
                <Switch checked={!!p.is_published} aria-label="প্রকাশ" onCheckedChange={(c) => attempt(update.mutateAsync({ id: p.id, values: { is_published: c } }), c ? "ছবি প্রকাশিত" : "ছবি লুকানো হয়েছে")} />
                <div className="ml-auto flex"><ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setEditing(p)} /><ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroy(p)} /></div>
              </div>
            </article>
          ))}
        </div>
      )}
      <UploadDialog open={uploading} adminId={adminId} onClose={() => setUploading(false)} />
      <EditDialog photo={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
