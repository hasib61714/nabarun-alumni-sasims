import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { BookHeart, CheckCircle2, Download, Eye, Pencil, PenLine, Star, Trash2, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { MemoryFormDialog } from "@/components/memories/MemoryFormDialog";
import { MediaThumb, MediaCarousel } from "@/components/memories/MemoryMedia";
import { attempt, useAdminRows, useRowMutations } from "@/hooks/useAdminData";
import { downloadCSV, todayStamp, type CsvColumn } from "@/lib/export";
import { moderateMemory } from "@/lib/memory-moderation";
import { excerpt, formatDate } from "@/lib/format";
import { coverOf, STATUS_LABEL, toMemory, type Memory, type MemoryStatus } from "@/lib/memories";
import { removeMemoryFiles } from "@/lib/memory-storage";
import { cn } from "@/lib/utils";
import { ActionButton, ListSkeleton, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

const CSV_COLUMNS: CsvColumn<Memory>[] = [
  { header: "শিরোনাম", value: (m) => m.title },
  { header: "লেখক", value: (m) => m.author_name },
  { header: "ব্যাচ", value: (m) => m.batch_year },
  { header: "বিভাগ", value: (m) => m.category },
  { header: "অবস্থা", value: (m) => STATUS_LABEL[m.status] },
  { header: "বিশেষ", value: (m) => (m.is_featured ? "হ্যাঁ" : "না") },
  { header: "ছবি/ভিডিও সংখ্যা", value: (m) => m.media.length },
  { header: "স্মৃতি", value: (m) => m.body },
  { header: "জমার তারিখ", value: (m) => m.created_at },
];

type Filter = MemoryStatus | "all";

function RejectDialog({ memory, onClose }: { memory: Memory | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!memory) return;
    setBusy(true);
    const ok = await attempt(moderateMemory(memory, { status: "rejected", rejection_reason: reason.trim() || null }), "স্মৃতি প্রত্যাখ্যান করা হয়েছে");
    setBusy(false);
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    if (ok) { setReason(""); onClose(); }
  };
  return (
    <FormDialog open={!!memory} onOpenChange={(o) => { if (!o) { setReason(""); onClose(); } }} title="স্মৃতি প্রত্যাখ্যান" description="লেখককে জানানোর জন্য কারণ লিখতে পারেন — তিনি নিজের ড্যাশবোর্ডে এটি দেখবেন।" onSubmit={submit} submitLabel="প্রত্যাখ্যান করুন" loading={busy}>
      <Field label="কারণ (ঐচ্ছিক)" hint={`${reason.length}/৫০০`}>
        <Textarea rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: ছবির মান ভালো নয়, অনুগ্রহ করে আরও বিস্তারিত লিখুন।" />
      </Field>
    </FormDialog>
  );
}

interface PreviewProps {
  memory: Memory | null;
  onClose: () => void;
  onApprove: (m: Memory) => void;
  onReject: (m: Memory) => void;
  onEdit: (m: Memory) => void;
  onDelete: (m: Memory) => void;
}

function PreviewDialog({ memory, onClose, onApprove, onReject, onEdit, onDelete }: PreviewProps) {
  return (
    <Dialog open={!!memory} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
        {memory && (
          <>
            <DialogHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={memory.status} label={STATUS_LABEL[memory.status]} />
                <span className="text-xs text-muted-foreground">{memory.category}</span>
              </div>
              <DialogTitle className="font-display text-2xl leading-snug">{memory.title}</DialogTitle>
              <DialogDescription>
                {memory.author_name}{memory.batch_year ? ` · ব্যাচ ${memory.batch_year}` : ""} · জমা: {formatDate(memory.created_at)}
              </DialogDescription>
            </DialogHeader>
            {memory.media.length > 0 && <MediaCarousel media={memory.media} title={memory.title} />}
            <p className="whitespace-pre-line break-words text-sm leading-7">{memory.body}</p>
            {memory.status === "rejected" && memory.rejection_reason && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300"><strong>প্রত্যাখ্যানের কারণ:</strong> {memory.rejection_reason}</p>
            )}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {memory.status !== "approved" && <Button className="gap-1.5" onClick={() => onApprove(memory)}><CheckCircle2 className="h-4 w-4" /> অনুমোদন ও প্রকাশ</Button>}
              {memory.status !== "rejected" && <Button variant="outline" className="gap-1.5" onClick={() => onReject(memory)}><XCircle className="h-4 w-4" /> প্রত্যাখ্যান</Button>}
              <Button variant="outline" className="gap-1.5" onClick={() => onEdit(memory)}><Pencil className="h-4 w-4" /> সম্পাদনা</Button>
              <Button variant="ghost" className="ml-auto gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(memory)}><Trash2 className="h-4 w-4" /> মুছুন</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MemoriesSection({ adminId, adminName }: { adminId: string; adminName: string }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useAdminRows("memories", "created_at");
  const { update, remove } = useRowMutations("memories");
  const [searchParams, setSearchParams] = useSearchParams();
  const memories = useMemo(() => rows.map((r) => toMemory(r as unknown as Record<string, unknown>)), [rows]);

  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Memory | null>(null);
  const [rejecting, setRejecting] = useState<Memory | null>(null);
  const [formTarget, setFormTarget] = useState<Memory | "new" | null>(null);
  const [working, setWorking] = useState(false);

  // "?new=1" (from the public "write your memory" buttons) opens the editor
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setFormTarget("new");
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const counts = useMemo(() => ({
    all: memories.length,
    pending: memories.filter((m) => m.status === "pending").length,
    approved: memories.filter((m) => m.status === "approved").length,
    rejected: memories.filter((m) => m.status === "rejected").length,
  }), [memories]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memories.filter((m) => (filter === "all" || m.status === filter) && (!q || `${m.title} ${m.body} ${m.author_name}`.toLowerCase().includes(q)));
  }, [memories, filter, search]);

  const closePreviewIf = (id: string) => setPreview((p) => (p?.id === id ? null : p));

  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["admin"] }), queryClient.invalidateQueries({ queryKey: ["memories"] })]);

  const setStatus = async (m: Memory, status: MemoryStatus, message: string) => {
    setWorking(true);
    const ok = await attempt(moderateMemory(m, { status }), message);
    setWorking(false);
    void refresh();
    if (ok) closePreviewIf(m.id);
  };
  const approve = (m: Memory) => setStatus(m, "approved", "স্মৃতি প্রকাশিত হয়েছে — এখন সবাই দেখতে পাবে");
  const unpublish = (m: Memory) => setStatus(m, "pending", "প্রকাশ বন্ধ করে অপেক্ষমান করা হয়েছে");
  const toggleFeatured = (m: Memory) => attempt(update.mutateAsync({ id: m.id, values: { is_featured: !m.is_featured } }), m.is_featured ? "বিশেষ চিহ্ন সরানো হয়েছে" : "বিশেষ স্মৃতি হিসেবে চিহ্নিত হয়েছে");

  // bulk actions only touch what is on screen AND ticked
  const selectedVisible = visible.filter((m) => selected.has(m.id) && m.status !== "approved");
  const bulkApprove = async () => {
    setWorking(true);
    let done = 0;
    let skipped = 0;
    for (const m of selectedVisible) {
      try { await moderateMemory(m, { status: "approved" }); done++; } catch { skipped++; }
    }
    setWorking(false);
    void refresh();
    setSelected(new Set());
    if (done) toast.success(`${done}টি স্মৃতি প্রকাশিত হয়েছে`);
    if (skipped) toast.warning(`${skipped}টি স্মৃতি এইমাত্র বদলে গেছে, তাই প্রকাশ করা হয়নি — আবার দেখে নিন।`);
  };

  const destroy = async (m: Memory) => {
    const ok = await confirm({ title: "স্মৃতিটি মুছে ফেলবেন?", description: `“${m.title}” এবং এর ছবি/ভিডিও স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true });
    if (!ok) return;
    if (await attempt(remove.mutateAsync(m.id), "স্মৃতি মুছে ফেলা হয়েছে")) {
      void removeMemoryFiles(m.media, m.user_id);
      closePreviewIf(m.id);
      setSelected((prev) => { const next = new Set(prev); next.delete(m.id); return next; });
    }
  };

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const chips: { id: Filter; label: string }[] = [
    { id: "pending", label: "অপেক্ষমান" }, { id: "approved", label: "প্রকাশিত" }, { id: "rejected", label: "প্রত্যাখ্যাত" }, { id: "all", label: "সব" },
  ];

  return (
    <div>
      <SectionHeader
        title="স্মৃতি মডারেশন" description="ব্যবহারকারীদের জমা দেওয়া স্মৃতি দেখে অনুমোদন দিলে তা সবার সামনে প্রকাশিত হবে।"
        actions={<><Button className="gap-2" onClick={() => setFormTarget("new")}><PenLine className="h-4 w-4" /> নতুন স্মৃতি লিখুন</Button><Button variant="outline" className="gap-2" disabled={memories.length === 0} onClick={() => downloadCSV(`nabarun-memories-${todayStamp()}.csv`, visible, CSV_COLUMNS)}><Download className="h-4 w-4" /> CSV</Button></>}
      />

      <Toolbar>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="অবস্থা">
          {chips.map((c) => (
            <button
              key={c.id} type="button" role="tab" aria-selected={filter === c.id} onClick={() => { setFilter(c.id); setSelected(new Set()); }}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", filter === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground")}
            >
              {c.label}
              <span className={cn("rounded-full px-1.5 text-xs", filter === c.id ? "bg-primary-foreground/20" : "bg-muted", c.id === "pending" && counts.pending > 0 && filter !== c.id && "bg-accent text-accent-foreground")}>{counts[c.id]}</span>
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setSelected(new Set()); }} placeholder="শিরোনাম, লেখা বা লেখক…" />
      </Toolbar>

      {selectedVisible.length > 0 && (
        <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 shadow-card backdrop-blur">
          <span className="text-sm font-medium">{selectedVisible.length}টি নির্বাচিত</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={bulkApprove} disabled={working}><CheckCircle2 className="h-4 w-4" /> অনুমোদন</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>পরিষ্কার</Button>
          </div>
        </div>
      )}

      {isLoading ? <ListSkeleton /> : visible.length === 0 ? (
        <EmptyState
          icon={BookHeart}
          title={filter === "pending" ? "অনুমোদনের অপেক্ষায় কোনো স্মৃতি নেই 🎉" : "কোনো স্মৃতি পাওয়া যায়নি"}
          description={memories.length === 0 ? "ব্যবহারকারীরা স্মৃতি জমা দিলে এখানে দেখা যাবে।" : "অন্য অবস্থা বা অন্য শব্দে খুঁজে দেখুন।"}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <article key={m.id} className={cn("group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-elevated", selected.has(m.id) && "ring-2 ring-primary")}>
              <div className="relative">
                <button type="button" onClick={() => setPreview(m)} className="block w-full text-left" aria-label={`${m.title} — দেখুন`}>
                  <MediaThumb media={coverOf(m)} alt="" className="aspect-video w-full" />
                </button>
                <div className="absolute left-2 top-2 rounded-md bg-background/90 p-1 backdrop-blur"><Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label="নির্বাচন করুন" /></div>
                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  {m.is_featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950"><Star className="h-3 w-3 fill-current" /> বিশেষ</span>}
                  <StatusBadge tone={m.status} label={STATUS_LABEL[m.status]} className="shadow-sm" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display font-semibold leading-snug line-clamp-2">{m.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.author_name}{m.batch_year ? ` · ব্যাচ ${m.batch_year}` : ""} · {m.category} · {formatDate(m.created_at)}{m.media.length ? ` · ${m.media.length}টি মিডিয়া` : ""}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{excerpt(m.body, 150)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1 border-t px-2 py-2">
                {m.status !== "approved" && <ActionButton showLabel icon={CheckCircle2} label="অনুমোদন" tone="success" onClick={() => approve(m)} disabled={working} />}
                {m.status === "approved" && <ActionButton showLabel icon={Undo2} label="প্রকাশ বন্ধ" onClick={() => unpublish(m)} disabled={working} />}
                {m.status !== "rejected" && <ActionButton icon={XCircle} label="প্রত্যাখ্যান" onClick={() => setRejecting(m)} />}
                <div className="ml-auto flex">
                  {m.status === "approved" && <ActionButton icon={Star} label={m.is_featured ? "বিশেষ চিহ্ন সরান" : "বিশেষ হিসেবে চিহ্নিত করুন"} onClick={() => toggleFeatured(m)} />}
                  <ActionButton icon={Eye} label="দেখুন" onClick={() => setPreview(m)} />
                  <ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setFormTarget(m)} />
                  <ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroy(m)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PreviewDialog
        memory={preview} onClose={() => setPreview(null)}
        onApprove={approve} onReject={(m) => { setPreview(null); setRejecting(m); }}
        onEdit={(m) => { setPreview(null); setFormTarget(m); }} onDelete={destroy}
      />
      <RejectDialog memory={rejecting} onClose={() => setRejecting(null)} />
      <MemoryFormDialog open={formTarget !== null} onOpenChange={(o) => !o && setFormTarget(null)} memory={formTarget === "new" ? null : formTarget} userId={adminId} authorName={adminName} asAdmin onSaved={() => { void queryClient.invalidateQueries({ queryKey: ["admin"] }); void queryClient.invalidateQueries({ queryKey: ["memories"] }); }} />
    </div>
  );
}
