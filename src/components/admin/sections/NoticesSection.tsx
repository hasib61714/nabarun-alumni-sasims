import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { excerpt, formatDate } from "@/lib/format";
import { ActionButton, ListSkeleton, SectionHeader } from "../AdminCommon";

type Notice = Row<"notices">;

const schema = z.object({
  title: z.string().trim().min(3, "শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(200),
  content: z.string().trim().min(3, "বিষয়বস্তু লিখুন").max(5000),
  is_published: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function NoticeDialog({ target, adminId, onClose }: { target: Notice | "new" | null; adminId: string; onClose: () => void }) {
  const { create, update } = useRowMutations("notices");
  const editing = target && target !== "new" ? target : null;
  const initial: FormValues = { title: editing?.title ?? "", content: editing?.content ?? "", is_published: editing?.is_published ?? true };
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  // start from the right values every time the dialog is opened
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (target) form.reset(initial); }, [target]);
  const errors = form.formState.errors;

  const save = form.handleSubmit(async (v) => {
    const ok = editing
      ? await attempt(update.mutateAsync({ id: editing.id, values: v }), "নোটিশ সংরক্ষিত হয়েছে")
      : await attempt(create.mutateAsync({ title: v.title, content: v.content, is_published: v.is_published, created_by: adminId }), "নোটিশ যুক্ত হয়েছে");
    if (ok) onClose();
  });

  return (
    <FormDialog open={!!target} onOpenChange={(o) => !o && onClose()} title={editing ? "নোটিশ সম্পাদনা" : "নতুন নোটিশ"} onSubmit={() => save()} loading={create.isPending || update.isPending}>
      <Field label="শিরোনাম" required error={errors.title?.message}><Input maxLength={200} {...form.register("title")} /></Field>
      <Field label="বিষয়বস্তু" required error={errors.content?.message}><Textarea rows={7} {...form.register("content")} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span className="text-sm"><span className="font-medium">এখনই প্রকাশ করুন</span><span className="block text-xs text-muted-foreground">বন্ধ থাকলে নোটিশটি সবার কাছে দেখা যাবে না।</span></span>
        <Switch checked={form.watch("is_published")} onCheckedChange={(c) => form.setValue("is_published", c, { shouldDirty: true })} />
      </label>
    </FormDialog>
  );
}

export default function NoticesSection({ adminId }: { adminId: string }) {
  const confirm = useConfirm();
  const { data: notices = [], isLoading } = useAdminRows("notices", "created_at");
  const { update, remove } = useRowMutations("notices");
  const [target, setTarget] = useState<Notice | "new" | null>(null);

  const destroy = async (n: Notice) => {
    if (await confirm({ title: "নোটিশটি মুছে ফেলবেন?", description: `“${n.title}” স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) {
      await attempt(remove.mutateAsync(n.id), "নোটিশ মুছে ফেলা হয়েছে");
    }
  };

  return (
    <div>
      <SectionHeader title="নোটিশ বোর্ড" description={`মোট ${notices.length}টি নোটিশ`} actions={<Button className="gap-2" onClick={() => setTarget("new")}><Plus className="h-4 w-4" /> নতুন নোটিশ</Button>} />
      {isLoading ? <ListSkeleton /> : notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="এখনো কোনো নোটিশ নেই" description="গুরুত্বপূর্ণ ঘোষণা দিতে প্রথম নোটিশটি যোগ করুন।" action={<Button onClick={() => setTarget("new")} className="gap-2"><Plus className="h-4 w-4" /> নোটিশ যোগ করুন</Button>} />
      ) : (
        <ul className="space-y-3">
          {notices.map((n) => (
            <li key={n.id} className="rounded-xl border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold">{n.title}</h3>
                    <StatusBadge tone={n.is_published ? "approved" : "neutral"} label={n.is_published ? "প্রকাশিত" : "অপ্রকাশিত"} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{excerpt(n.content, 220)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                  <Switch checked={!!n.is_published} aria-label="প্রকাশ" onCheckedChange={(c) => attempt(update.mutateAsync({ id: n.id, values: { is_published: c } }), c ? "নোটিশ প্রকাশিত" : "নোটিশ লুকানো হয়েছে")} />
                  <ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setTarget(n)} />
                  <ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroy(n)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <NoticeDialog target={target} adminId={adminId} onClose={() => setTarget(null)} />
    </div>
  );
}
