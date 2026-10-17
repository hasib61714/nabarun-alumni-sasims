import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Download, Eye, GraduationCap, Pencil, Trash2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { ResponsiveTable, type Column } from "@/components/common/ResponsiveTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { downloadCSV, todayStamp, type CsvColumn } from "@/lib/export";
import { formatDate, initialsOf } from "@/lib/format";
import { safeHttpsUrl } from "@/lib/memories";
import { usePagination } from "@/hooks/usePagination";
import { ActionButton, ListSkeleton, Pager, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

type Student = Row<"student_profiles">;

const optionalUrl = z.string().trim().max(300).refine((v) => !v || /^https?:\/\//i.test(v), "https:// দিয়ে শুরু হওয়া লিংক দিন");
const schema = z.object({
  full_name: z.string().trim().min(1, "নাম দিন").max(100),
  roll: z.string().trim().max(30),
  batch_year: z.string().trim().regex(/^(\d{4})?$/, "সঠিক সাল লিখুন"),
  result: z.string().trim().max(500),
  achievement: z.string().trim().max(1000),
  current_profession: z.string().trim().max(120),
  higher_study: z.string().trim().max(200),
  location: z.string().trim().max(120),
  linkedin_link: optionalUrl,
  facebook_link: optionalUrl,
});
type FormValues = z.infer<typeof schema>;

const toForm = (s: Student): FormValues => ({
  full_name: s.full_name ?? "", roll: s.roll ?? "", batch_year: s.batch_year?.toString() ?? "", result: s.result ?? "",
  achievement: s.achievement ?? "", current_profession: s.current_profession ?? "", higher_study: s.higher_study ?? "",
  location: s.location ?? "", linkedin_link: s.linkedin_link ?? "", facebook_link: s.facebook_link ?? "",
});
const blank = (v: string) => (v === "" ? null : v);

const CSV_COLUMNS: CsvColumn<Student>[] = [
  { header: "নাম", value: (s) => s.full_name },
  { header: "রোল", value: (s) => s.roll },
  { header: "ব্যাচ", value: (s) => s.batch_year },
  { header: "পেশা", value: (s) => s.current_profession },
  { header: "ফলাফল", value: (s) => s.result },
  { header: "অর্জন", value: (s) => s.achievement },
  { header: "উচ্চশিক্ষা", value: (s) => s.higher_study },
  { header: "অবস্থান", value: (s) => s.location },
  { header: "LinkedIn", value: (s) => s.linkedin_link },
  { header: "Facebook", value: (s) => s.facebook_link },
  { header: "অনুমোদিত", value: (s) => (s.is_approved ? "হ্যাঁ" : "না") },
  { header: "যোগদান", value: (s) => s.created_at },
];

function StudentAvatar({ student, className }: { student: Student; className?: string }) {
  const photo = safeHttpsUrl(student.photo);
  return (
    <Avatar className={className}>
      {photo && <AvatarImage src={photo} alt="" />}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(student.full_name)}</AvatarFallback>
    </Avatar>
  );
}

function EditStudentDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const { update } = useRowMutations("student_profiles", "user_id");
  const form = useForm<FormValues>({ resolver: zodResolver(schema), values: student ? toForm(student) : undefined });
  const errors = form.formState.errors;

  const save = form.handleSubmit(async (v) => {
    if (!student) return;
    const ok = await attempt(
      update.mutateAsync({
        id: student.user_id,
        values: {
          full_name: v.full_name, roll: blank(v.roll), batch_year: v.batch_year ? Number(v.batch_year) : null, result: blank(v.result),
          achievement: blank(v.achievement), current_profession: blank(v.current_profession), higher_study: blank(v.higher_study),
          location: blank(v.location), linkedin_link: blank(v.linkedin_link), facebook_link: blank(v.facebook_link),
        },
      }),
      "তথ্য সংরক্ষিত হয়েছে",
    );
    if (ok) onClose();
  });

  return (
    <FormDialog open={!!student} onOpenChange={(o) => !o && onClose()} title="ছাত্রের তথ্য সম্পাদনা" onSubmit={() => save()} loading={update.isPending} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="পূর্ণ নাম" required error={errors.full_name?.message} className="sm:col-span-2"><Input {...form.register("full_name")} /></Field>
        <Field label="রোল" error={errors.roll?.message}><Input {...form.register("roll")} /></Field>
        <Field label="ব্যাচ (সাল)" error={errors.batch_year?.message}><Input inputMode="numeric" maxLength={4} {...form.register("batch_year")} /></Field>
        <Field label="বর্তমান পেশা" error={errors.current_profession?.message}><Input {...form.register("current_profession")} /></Field>
        <Field label="উচ্চশিক্ষা" error={errors.higher_study?.message}><Input {...form.register("higher_study")} /></Field>
        <Field label="অবস্থান" error={errors.location?.message} className="sm:col-span-2"><Input {...form.register("location")} /></Field>
        <Field label="একাডেমিক ফলাফল" error={errors.result?.message} className="sm:col-span-2"><Textarea rows={2} {...form.register("result")} /></Field>
        <Field label="অর্জনসমূহ" error={errors.achievement?.message} className="sm:col-span-2"><Textarea rows={3} {...form.register("achievement")} /></Field>
        <Field label="LinkedIn" error={errors.linkedin_link?.message}><Input inputMode="url" placeholder="https://" {...form.register("linkedin_link")} /></Field>
        <Field label="Facebook" error={errors.facebook_link?.message}><Input inputMode="url" placeholder="https://" {...form.register("facebook_link")} /></Field>
      </div>
    </FormDialog>
  );
}

function StudentDetail({ student, onClose, onEdit }: { student: Student | null; onClose: () => void; onEdit: (s: Student) => void }) {
  const rows: [string, string | number | null | undefined][] = student ? [
    ["রোল", student.roll], ["ব্যাচ", student.batch_year], ["বর্তমান পেশা", student.current_profession], ["উচ্চশিক্ষা", student.higher_study],
    ["অবস্থান", student.location], ["ফলাফল", student.result], ["অর্জন", student.achievement], ["যোগদান", formatDate(student.created_at)],
  ] : [];
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {student && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <StudentAvatar student={student} className="h-14 w-14" />
                <div className="text-left">
                  <DialogTitle className="font-display">{student.full_name || "নামহীন"}</DialogTitle>
                  <DialogDescription asChild><div className="mt-1"><StatusBadge tone={student.is_approved ? "approved" : "pending"} label={student.is_approved ? "অনুমোদিত" : "অপেক্ষমান"} /></div></DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <dl className="divide-y text-sm">
              {rows.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 whitespace-pre-line break-words">{v}</dd></div>
              ))}
              {[["LinkedIn", student.linkedin_link], ["Facebook", student.facebook_link]].map(([k, v]) => v && safeHttpsUrl(v) && (
                <div key={k} className="grid grid-cols-3 gap-3 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 break-all"><a className="text-primary hover:underline" href={v} target="_blank" rel="noopener noreferrer">{v}</a></dd></div>
              ))}
            </dl>
            <Button variant="outline" className="gap-2" onClick={() => { onClose(); onEdit(student); }}><Pencil className="h-4 w-4" /> সম্পাদনা করুন</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function StudentsSection() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useAdminRows("student_profiles", "created_at");
  const { update, updateMany } = useRowMutations("student_profiles", "user_id");

  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_delete_user", { target_user_id: userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const batches = useMemo(() => [...new Set(students.map((s) => s.batch_year).filter((b): b is number => !!b))].sort((a, b) => b - a), [students]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) =>
      (!q || (s.full_name ?? "").toLowerCase().includes(q) || (s.roll ?? "").toLowerCase().includes(q)) &&
      (batch === "all" || s.batch_year?.toString() === batch) &&
      (status === "all" || (status === "approved" ? !!s.is_approved : !s.is_approved)),
    );
  }, [students, search, batch, status]);
  const pager = usePagination(filtered, 15);

  const setApproval = async (s: Student, approve: boolean) =>
    attempt(update.mutateAsync({ id: s.user_id, values: { is_approved: approve } }), approve ? "ছাত্র অনুমোদিত হয়েছে" : "অনুমোদন প্রত্যাহার করা হয়েছে");

  const bulkApproval = async (approve: boolean) => {
    const ids = [...selected];
    if (await attempt(updateMany.mutateAsync({ ids, values: { is_approved: approve } }), `${ids.length} জনের ${approve ? "অনুমোদন দেওয়া" : "অনুমোদন প্রত্যাহার করা"} হয়েছে`)) setSelected(new Set());
  };

  const remove = async (s: Student) => {
    const ok = await confirm({
      title: `${s.full_name || "এই ছাত্র"}-কে মুছে ফেলবেন?`,
      description: "লগইন অ্যাকাউন্ট, প্রোফাইল এবং তার লেখা সব স্মৃতি ও মতামত স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না — প্রয়োজনে আগে CSV/ব্যাকআপ নিয়ে রাখুন।",
      confirmLabel: "স্থায়ীভাবে মুছুন",
      destructive: true,
    });
    if (ok) {
      await attempt(deleteUser.mutateAsync(s.user_id), "ছাত্র মুছে ফেলা হয়েছে");
      setSelected((prev) => { const next = new Set(prev); next.delete(s.user_id); return next; });
    }
  };

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.user_id))));

  const columns: Column<Student>[] = [
    { key: "name", header: "নাম", primary: true, cell: (s) => (
      <div className="flex items-center gap-3"><StudentAvatar student={s} className="h-9 w-9" /><div className="min-w-0"><p className="truncate font-medium">{s.full_name || "নামহীন"}</p><p className="truncate text-xs text-muted-foreground">{s.location || "—"}</p></div></div>
    ) },
    { key: "roll", header: "রোল", cell: (s) => s.roll || "—" },
    { key: "batch", header: "ব্যাচ", cell: (s) => s.batch_year ?? "—" },
    { key: "job", header: "পেশা", className: "max-w-48 truncate", cell: (s) => s.current_profession || "—" },
    { key: "status", header: "অবস্থা", cell: (s) => <StatusBadge tone={s.is_approved ? "approved" : "pending"} label={s.is_approved ? "অনুমোদিত" : "অপেক্ষমান"} /> },
    { key: "joined", header: "যোগদান", hideOnMobile: true, cell: (s) => formatDate(s.created_at) },
  ];

  return (
    <div>
      <SectionHeader
        title="ছাত্র ব্যবস্থাপনা" description={`মোট ${students.length} জন · অপেক্ষমান ${students.filter((s) => !s.is_approved).length} জন`}
        actions={<Button variant="outline" className="gap-2" onClick={() => downloadCSV(`nabarun-students-${todayStamp()}.csv`, filtered, CSV_COLUMNS)} disabled={filtered.length === 0}><Download className="h-4 w-4" /> CSV ডাউনলোড</Button>}
      />

      <Toolbar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); pager.setPage(1); }} placeholder="নাম বা রোল দিয়ে খুঁজুন…" />
        <Select value={batch} onValueChange={(v) => { setBatch(v); pager.setPage(1); }}>
          <SelectTrigger className="sm:w-36" aria-label="ব্যাচ"><SelectValue placeholder="ব্যাচ" /></SelectTrigger>
          <SelectContent><SelectItem value="all">সকল ব্যাচ</SelectItem>{batches.map((b) => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); pager.setPage(1); }}>
          <SelectTrigger className="sm:w-40" aria-label="অবস্থা"><SelectValue placeholder="অবস্থা" /></SelectTrigger>
          <SelectContent><SelectItem value="all">সব অবস্থা</SelectItem><SelectItem value="approved">অনুমোদিত</SelectItem><SelectItem value="pending">অপেক্ষমান</SelectItem></SelectContent>
        </Select>
      </Toolbar>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 shadow-card backdrop-blur">
          <span className="text-sm font-medium">{selected.size} জন নির্বাচিত</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => bulkApproval(true)} disabled={updateMany.isPending}><CheckCircle2 className="h-4 w-4" /> অনুমোদন</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => bulkApproval(false)} disabled={updateMany.isPending}><XCircle className="h-4 w-4" /> প্রত্যাহার</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadCSV(`nabarun-students-selected-${todayStamp()}.csv`, students.filter((s) => selected.has(s.user_id)), CSV_COLUMNS)}><Download className="h-4 w-4" /> CSV</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>পরিষ্কার</Button>
          </div>
        </div>
      )}

      {isLoading ? <ListSkeleton /> : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="কোনো ছাত্র পাওয়া যায়নি" description={students.length === 0 ? "ছাত্ররা রেজিস্টার করলে এখানে দেখা যাবে।" : "ফিল্টার বা সার্চ বদলে দেখুন।"} />
      ) : (
        <>
          <ResponsiveTable
            rows={pager.pageItems} columns={columns} rowKey={(s) => s.user_id} onRowClick={(s) => setViewing(s)}
            selection={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
            actions={(s) => (
              <>
                {s.is_approved
                  ? <ActionButton icon={XCircle} label="অনুমোদন প্রত্যাহার" onClick={() => setApproval(s, false)} />
                  : <ActionButton icon={CheckCircle2} label="অনুমোদন দিন" tone="success" onClick={() => setApproval(s, true)} />}
                <ActionButton icon={Eye} label="বিস্তারিত" onClick={() => setViewing(s)} />
                <ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setEditing(s)} />
                <ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => remove(s)} />
              </>
            )}
          />
          <Pager {...pager} onPage={pager.setPage} />
        </>
      )}

      <StudentDetail student={viewing} onClose={() => setViewing(null)} onEdit={(s) => setEditing(s)} />
      <EditStudentDialog student={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
