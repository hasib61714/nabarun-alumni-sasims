import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, MessageSquareQuote, Pencil, Trash2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { ResponsiveTable, type Column } from "@/components/common/ResponsiveTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { yearField } from "@/lib/forms";
import { excerpt, formatDate, initialsOf } from "@/lib/format";
import { safeHttpsUrl } from "@/lib/memories";
import { ActionButton, ListSkeleton, SectionHeader } from "../AdminCommon";

type Testimonial = Row<"testimonials">;

const schema = z.object({
  name: z.string().trim().min(1, "নাম দিন").max(100),
  batch_year: yearField,
  profession: z.string().trim().max(120),
  message: z.string().trim().min(10, "কমপক্ষে ১০ অক্ষর লিখুন").max(500, "৫০০ অক্ষরের মধ্যে লিখুন"),
});
type FormValues = z.infer<typeof schema>;

function EditDialog({ item, onClose }: { item: Testimonial | null; onClose: () => void }) {
  const { update } = useRowMutations("testimonials");
  const initial: FormValues | undefined = item ? { name: item.name, batch_year: item.batch_year?.toString() ?? "", profession: item.profession ?? "", message: item.message } : undefined;
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initial) form.reset(initial); }, [item]);
  const errors = form.formState.errors;
  const save = form.handleSubmit(async (v) => {
    if (!item) return;
    const ok = await attempt(update.mutateAsync({ id: item.id, values: { name: v.name, batch_year: v.batch_year ? Number(v.batch_year) : null, profession: v.profession || null, message: v.message } }), "মতামত সংরক্ষিত হয়েছে");
    if (ok) onClose();
  });
  return (
    <FormDialog open={!!item} onOpenChange={(o) => !o && onClose()} title="মতামত সম্পাদনা" onSubmit={() => save()} loading={update.isPending}>
      <Field label="নাম" required error={errors.name?.message}><Input {...form.register("name")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ব্যাচ" error={errors.batch_year?.message}><Input inputMode="numeric" maxLength={4} {...form.register("batch_year")} /></Field>
        <Field label="পেশা" error={errors.profession?.message}><Input {...form.register("profession")} /></Field>
      </div>
      <Field label="মতামত" required error={errors.message?.message}><Textarea rows={5} maxLength={500} {...form.register("message")} /></Field>
    </FormDialog>
  );
}

export default function TestimonialsSection() {
  const confirm = useConfirm();
  const { data: items = [], isLoading } = useAdminRows("testimonials", "created_at");
  const { update, remove } = useRowMutations("testimonials");
  const [editing, setEditing] = useState<Testimonial | null>(null);

  const setApproval = (t: Testimonial, approve: boolean) =>
    attempt(update.mutateAsync({ id: t.id, values: { is_approved: approve } }), approve ? "মতামত প্রকাশিত হয়েছে" : "প্রকাশ বন্ধ করা হয়েছে");

  const destroy = async (t: Testimonial) => {
    if (await confirm({ title: "মতামতটি মুছে ফেলবেন?", description: `${t.name}-এর মতামত স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) {
      await attempt(remove.mutateAsync(t.id), "মতামত মুছে ফেলা হয়েছে");
    }
  };

  const columns: Column<Testimonial>[] = [
    { key: "name", header: "নাম", primary: true, cell: (t) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">{safeHttpsUrl(t.photo) && <AvatarImage src={t.photo!} alt="" />}<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(t.name)}</AvatarFallback></Avatar>
        <div className="min-w-0"><p className="truncate font-medium">{t.name}</p><p className="truncate text-xs text-muted-foreground">{t.profession || "—"}{t.batch_year ? ` · ব্যাচ ${t.batch_year}` : ""}</p></div>
      </div>
    ) },
    { key: "msg", header: "মতামত", className: "max-w-sm", cell: (t) => <span className="text-sm text-muted-foreground">{excerpt(t.message, 140)}</span> },
    { key: "status", header: "অবস্থা", cell: (t) => <StatusBadge tone={t.is_approved ? "approved" : "pending"} label={t.is_approved ? "প্রকাশিত" : "অপেক্ষমান"} /> },
    { key: "date", header: "তারিখ", hideOnMobile: true, cell: (t) => formatDate(t.created_at) },
  ];

  return (
    <div>
      <SectionHeader title="ছাত্রদের মতামত" description="অনুমোদন দিলে হোম পেজে সবার সামনে দেখানো হবে।" />
      {isLoading ? <ListSkeleton /> : items.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="এখনো কোনো মতামত জমা পড়েনি" description="ছাত্ররা ড্যাশবোর্ড থেকে মতামত পাঠালে এখানে দেখা যাবে।" />
      ) : (
        <ResponsiveTable
          rows={items} columns={columns} rowKey={(t) => t.id}
          actions={(t) => (
            <>
              {t.is_approved ? <ActionButton icon={XCircle} label="প্রকাশ বন্ধ" onClick={() => setApproval(t, false)} /> : <ActionButton icon={CheckCircle2} label="অনুমোদন দিন" tone="success" onClick={() => setApproval(t, true)} />}
              <ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setEditing(t)} />
              <ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroy(t)} />
            </>
          )}
        />
      )}
      <EditDialog item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
