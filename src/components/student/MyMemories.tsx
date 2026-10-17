import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookHeart, ExternalLink, Pencil, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { MemoryFormDialog } from "@/components/memories/MemoryFormDialog";
import { MediaThumb } from "@/components/memories/MemoryMedia";
import { excerpt, formatDate } from "@/lib/format";
import { coverOf, STATUS_LABEL, toMemory, type Memory } from "@/lib/memories";
import { removeMemoryFiles } from "@/lib/memory-storage";

interface Props {
  userId: string;
  authorName: string;
  defaultBatch: string;
}

export default function MyMemories({ userId, authorName, defaultBatch }: Props) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Memory | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: memories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["memories", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toMemory);
    },
  });

  // "?new=1" (from the public pages) opens the editor straight away
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["memories"] });

  const remove = useMutation({
    mutationFn: async (memory: Memory) => {
      const { error } = await supabase.from("memories").delete().eq("id", memory.id);
      if (error) throw error;
      await removeMemoryFiles(memory.media, memory.user_id);
    },
    onSuccess: () => { toast.success("স্মৃতি মুছে ফেলা হয়েছে"); void refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const askDelete = async (memory: Memory) => {
    const ok = await confirm({
      title: "স্মৃতিটি মুছে ফেলবেন?",
      description: `“${memory.title}” এবং এর ছবি/ভিডিও স্থায়ীভাবে মুছে যাবে।`,
      confirmLabel: "মুছে ফেলুন",
      destructive: true,
    });
    if (ok) remove.mutate(memory);
  };

  const counts = {
    approved: memories.filter((m) => m.status === "approved").length,
    pending: memories.filter((m) => m.status === "pending").length,
    rejected: memories.filter((m) => m.status === "rejected").length,
  };

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (m: Memory) => { setEditing(m); setFormOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">আমার স্মৃতি</h2>
          <p className="text-sm text-muted-foreground">নবারুণের মুহূর্তগুলো লিখুন, ছবি বা ভিডিও যোগ করুন। অ্যাডমিন অনুমোদন দিলে সবাই দেখতে পাবে।</p>
        </div>
        <Button onClick={openNew} className="gap-2 self-start sm:self-auto"><PenLine className="h-4 w-4" /> নতুন স্মৃতি লিখুন</Button>
      </div>

      {memories.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <StatusBadge tone="approved" label={`${STATUS_LABEL.approved}: ${counts.approved}`} />
          <StatusBadge tone="pending" label={`${STATUS_LABEL.pending}: ${counts.pending}`} />
          {counts.rejected > 0 && <StatusBadge tone="rejected" label={`${STATUS_LABEL.rejected}: ${counts.rejected}`} />}
        </div>
      )}

      {isLoading && <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>}

      {isError && <EmptyState icon={BookHeart} title="স্মৃতি লোড করা যায়নি" action={<Button onClick={() => refetch()}>আবার চেষ্টা করুন</Button>} />}

      {!isLoading && !isError && memories.length === 0 && (
        <EmptyState
          icon={BookHeart} title="এখনো কোনো স্মৃতি লেখেননি"
          description="স্কুলের প্রথম দিন, প্রিয় শিক্ষক, বন্ধুদের সাথে কাটানো সময় — যা মনে পড়ে লিখে ফেলুন।"
          action={<Button onClick={openNew} className="gap-2"><PenLine className="h-4 w-4" /> প্রথম স্মৃতি লিখুন</Button>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {memories.map((m, i) => (
          <motion.article
            key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }}
            className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card"
          >
            <div className="flex gap-3 p-3 sm:p-4">
              <MediaThumb media={coverOf(m)} alt="" className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={m.status} label={STATUS_LABEL[m.status]} />
                  <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                </div>
                <h3 className="font-display font-semibold leading-snug line-clamp-2">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{excerpt(m.body, 100)}</p>
              </div>
            </div>
            {m.status === "rejected" && (
              <p className="mx-3 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-300 sm:mx-4">
                <strong>অ্যাডমিনের মন্তব্য:</strong> {m.rejection_reason || "কারণ উল্লেখ করা হয়নি।"} — সম্পাদনা করে আবার জমা দিতে পারেন।
              </p>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-1 border-t px-2 py-2">
              <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link to={`/memories/${m.id}`}><ExternalLink className="h-4 w-4" /> দেখুন</Link></Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /> সম্পাদনা</Button>
              <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => askDelete(m)} disabled={remove.isPending}>
                <Trash2 className="h-4 w-4" /> মুছুন
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      <MemoryFormDialog
        open={formOpen} onOpenChange={setFormOpen} memory={editing}
        userId={userId} authorName={authorName} defaultBatch={defaultBatch}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
