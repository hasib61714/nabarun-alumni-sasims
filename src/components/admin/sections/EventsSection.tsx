import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { ResponsiveTable, type Column } from "@/components/common/ResponsiveTable";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { formatDate } from "@/lib/format";
import { ActionButton, ListSkeleton, SectionHeader } from "../AdminCommon";

type EventRow = Row<"events">;
const EVENT_CATEGORIES = ["অনুষ্ঠান", "পরীক্ষা", "সভা", "খেলাধুলা", "অন্যান্য"];

const schema = z.object({
  title: z.string().trim().min(3, "শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(200),
  event_date: z.string().min(1, "তারিখ দিন"),
  event_time: z.string(),
  location: z.string().trim().max(200),
  category: z.string().min(1),
  description: z.string().trim().max(3000),
  is_published: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function EventDialog({ target, adminId, onClose }: { target: EventRow | "new" | null; adminId: string; onClose: () => void }) {
  const { create, update } = useRowMutations("events");
  const editing = target && target !== "new" ? target : null;
  const initial: FormValues = {
      title: editing?.title ?? "", event_date: editing?.event_date ?? "", event_time: editing?.event_time?.slice(0, 5) ?? "", location: editing?.location ?? "",
      category: editing?.category ?? EVENT_CATEGORIES[0], description: editing?.description ?? "", is_published: editing?.is_published ?? true,
    };
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (target) form.reset(initial); }, [target]);
  const errors = form.formState.errors;

  const save = form.handleSubmit(async (v) => {
    const values = { title: v.title, event_date: v.event_date, event_time: v.event_time || null, location: v.location || null, category: v.category, description: v.description || null, is_published: v.is_published };
    const ok = editing
      ? await attempt(update.mutateAsync({ id: editing.id, values }), "ইভেন্ট সংরক্ষিত হয়েছে")
      : await attempt(create.mutateAsync({ ...values, created_by: adminId }), "ইভেন্ট যুক্ত হয়েছে");
    if (ok) onClose();
  });

  return (
    <FormDialog open={!!target} onOpenChange={(o) => !o && onClose()} title={editing ? "ইভেন্ট সম্পাদনা" : "নতুন ইভেন্ট"} onSubmit={() => save()} loading={create.isPending || update.isPending} wide>
      <Field label="শিরোনাম" required error={errors.title?.message}><Input maxLength={200} {...form.register("title")} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="তারিখ" required error={errors.event_date?.message}><Input type="date" {...form.register("event_date")} /></Field>
        <Field label="সময়"><Input type="time" {...form.register("event_time")} /></Field>
        <Field label="ধরন">
          <Select value={form.watch("category")} onValueChange={(c) => form.setValue("category", c, { shouldDirty: true })}>
            <SelectTrigger aria-label="ধরন"><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="স্থান" error={errors.location?.message}><Input maxLength={200} {...form.register("location")} /></Field>
      <Field label="বিবরণ" error={errors.description?.message}><Textarea rows={5} {...form.register("description")} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span className="text-sm font-medium">প্রকাশিত</span>
        <Switch checked={form.watch("is_published")} onCheckedChange={(c) => form.setValue("is_published", c, { shouldDirty: true })} />
      </label>
    </FormDialog>
  );
}

export default function EventsSection({ adminId }: { adminId: string }) {
  const confirm = useConfirm();
  const { data: events = [], isLoading } = useAdminRows("events", "event_date");
  const { update, remove } = useRowMutations("events");
  const [target, setTarget] = useState<EventRow | "new" | null>(null);

  const destroy = async (e: EventRow) => {
    if (await confirm({ title: "ইভেন্টটি মুছে ফেলবেন?", description: `“${e.title}” স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) {
      await attempt(remove.mutateAsync(e.id), "ইভেন্ট মুছে ফেলা হয়েছে");
    }
  };

  const columns: Column<EventRow>[] = [
    { key: "title", header: "ইভেন্ট", primary: true, cell: (e) => <span className="font-medium">{e.title}</span> },
    { key: "date", header: "তারিখ", cell: (e) => <>{formatDate(e.event_date)}{e.event_time ? `, ${e.event_time.slice(0, 5)}` : ""}</> },
    { key: "cat", header: "ধরন", cell: (e) => e.category },
    { key: "loc", header: "স্থান", cell: (e) => (e.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{e.location}</span> : "—") },
    { key: "pub", header: "প্রকাশ", cell: (e) => <Switch checked={!!e.is_published} aria-label="প্রকাশ" onCheckedChange={(c) => attempt(update.mutateAsync({ id: e.id, values: { is_published: c } }), c ? "ইভেন্ট প্রকাশিত" : "ইভেন্ট লুকানো হয়েছে")} /> },
  ];

  return (
    <div>
      <SectionHeader title="ইভেন্ট" description={`মোট ${events.length}টি ইভেন্ট`} actions={<Button className="gap-2" onClick={() => setTarget("new")}><Plus className="h-4 w-4" /> নতুন ইভেন্ট</Button>} />
      {isLoading ? <ListSkeleton /> : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="এখনো কোনো ইভেন্ট নেই" description="পুনর্মিলনী বা অনুষ্ঠানের তথ্য যোগ করুন।" action={<Button onClick={() => setTarget("new")} className="gap-2"><Plus className="h-4 w-4" /> ইভেন্ট যোগ করুন</Button>} />
      ) : (
        <ResponsiveTable
          rows={events} columns={columns} rowKey={(e) => e.id}
          actions={(e) => (<><ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setTarget(e)} /><ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroy(e)} /></>)}
        />
      )}
      <EventDialog target={target} adminId={adminId} onClose={() => setTarget(null)} />
    </div>
  );
}
