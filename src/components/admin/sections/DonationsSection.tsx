import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Clock, Download, HandCoins, Pencil, Plus, Target, Trash2, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Field, FormDialog } from "@/components/common/FormDialog";
import { ResponsiveTable, type Column } from "@/components/common/ResponsiveTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { downloadCSV, todayStamp, type CsvColumn } from "@/lib/export";
import { excerpt, formatDate, formatTaka } from "@/lib/format";
import { ActionButton, CountBubble, ListSkeleton, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

type Donation = Row<"donations">;
type Campaign = Row<"donation_campaigns">;

const PAYMENT_METHODS = ["বিকাশ", "নগদ", "রকেট", "ব্যাংক ট্রান্সফার", "নগদ অর্থ"];
const STATUS: Record<string, { label: string; tone: "pending" | "approved" | "rejected" }> = {
  pending: { label: "অপেক্ষমান", tone: "pending" }, approved: { label: "অনুমোদিত", tone: "approved" }, rejected: { label: "প্রত্যাখ্যাত", tone: "rejected" },
};

const donationSchema = z.object({
  donor_name: z.string().trim().min(1, "নাম দিন").max(100),
  donor_phone: z.string().trim().max(20),
  donor_email: z.string().trim().max(255).refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "সঠিক ইমেইল দিন"),
  amount: z.string().refine((v) => Number(v) > 0, "০ এর বেশি পরিমাণ দিন"),
  purpose: z.string().trim().max(500),
  campaign_id: z.string(),
  payment_method: z.string(),
  transaction_id: z.string().trim().max(100),
  status: z.enum(["pending", "approved", "rejected"]),
  notes: z.string().trim().max(1000),
});
type DonationForm = z.infer<typeof donationSchema>;

function DonationDialog({ donation, campaigns, onClose }: { donation: Donation | null; campaigns: Campaign[]; onClose: () => void }) {
  const { update } = useRowMutations("donations");
  const form = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    values: donation ? {
      donor_name: donation.donor_name, donor_phone: donation.donor_phone ?? "", donor_email: donation.donor_email ?? "", amount: String(donation.amount),
      purpose: donation.purpose ?? "", campaign_id: donation.campaign_id ?? "none", payment_method: donation.payment_method ?? PAYMENT_METHODS[0],
      transaction_id: donation.transaction_id ?? "", status: (donation.status as DonationForm["status"]) ?? "pending", notes: donation.notes ?? "",
    } : undefined,
  });
  const errors = form.formState.errors;
  const save = form.handleSubmit(async (v) => {
    if (!donation) return;
    const ok = await attempt(update.mutateAsync({ id: donation.id, values: {
      donor_name: v.donor_name, donor_phone: v.donor_phone || null, donor_email: v.donor_email || null, amount: Number(v.amount), purpose: v.purpose || null,
      campaign_id: v.campaign_id === "none" ? null : v.campaign_id, payment_method: v.payment_method, transaction_id: v.transaction_id || null, status: v.status, notes: v.notes || null,
    } }), "অনুদানের তথ্য সংরক্ষিত হয়েছে");
    if (ok) onClose();
  });
  return (
    <FormDialog open={!!donation} onOpenChange={(o) => !o && onClose()} title="অনুদান সম্পাদনা" onSubmit={() => save()} loading={update.isPending} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="দাতার নাম" required error={errors.donor_name?.message}><Input {...form.register("donor_name")} /></Field>
        <Field label="পরিমাণ (৳)" required error={errors.amount?.message}><Input inputMode="decimal" {...form.register("amount")} /></Field>
        <Field label="ফোন" error={errors.donor_phone?.message}><Input {...form.register("donor_phone")} /></Field>
        <Field label="ইমেইল" error={errors.donor_email?.message}><Input type="email" {...form.register("donor_email")} /></Field>
        <Field label="পেমেন্ট মাধ্যম">
          <Select value={form.watch("payment_method")} onValueChange={(v) => form.setValue("payment_method", v, { shouldDirty: true })}>
            <SelectTrigger aria-label="পেমেন্ট মাধ্যম"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="ট্রানজেকশন আইডি" error={errors.transaction_id?.message}><Input {...form.register("transaction_id")} /></Field>
        <Field label="ক্যাম্পেইন">
          <Select value={form.watch("campaign_id")} onValueChange={(v) => form.setValue("campaign_id", v, { shouldDirty: true })}>
            <SelectTrigger aria-label="ক্যাম্পেইন"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">সাধারণ তহবিল</SelectItem>{campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="অবস্থা">
          <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as DonationForm["status"], { shouldDirty: true })}>
            <SelectTrigger aria-label="অবস্থা"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="উদ্দেশ্য" error={errors.purpose?.message}><Textarea rows={2} {...form.register("purpose")} /></Field>
      <Field label="অ্যাডমিন নোট (শুধু অ্যাডমিন দেখবে)" error={errors.notes?.message}><Textarea rows={2} {...form.register("notes")} /></Field>
    </FormDialog>
  );
}

const campaignSchema = z.object({
  title: z.string().trim().min(3, "শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(150),
  description: z.string().trim().max(2000),
  goal_amount: z.string().refine((v) => v === "" || Number(v) > 0, "০ এর বেশি লক্ষ্য দিন"),
  is_active: z.boolean(),
});
type CampaignForm = z.infer<typeof campaignSchema>;

function CampaignDialog({ target, adminId, onClose }: { target: Campaign | "new" | null; adminId: string; onClose: () => void }) {
  const { create, update } = useRowMutations("donation_campaigns");
  const editing = target && target !== "new" ? target : null;
  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    values: { title: editing?.title ?? "", description: editing?.description ?? "", goal_amount: editing?.goal_amount ? String(editing.goal_amount) : "", is_active: editing?.is_active ?? true },
  });
  const errors = form.formState.errors;
  const save = form.handleSubmit(async (v) => {
    const values = { title: v.title, description: v.description || null, goal_amount: v.goal_amount ? Number(v.goal_amount) : null, is_active: v.is_active };
    const ok = editing
      ? await attempt(update.mutateAsync({ id: editing.id, values }), "ক্যাম্পেইন সংরক্ষিত হয়েছে")
      : await attempt(create.mutateAsync({ ...values, created_by: adminId }), "ক্যাম্পেইন তৈরি হয়েছে");
    if (ok) onClose();
  });
  return (
    <FormDialog open={!!target} onOpenChange={(o) => !o && onClose()} title={editing ? "ক্যাম্পেইন সম্পাদনা" : "নতুন ক্যাম্পেইন"} onSubmit={() => save()} loading={create.isPending || update.isPending}>
      <Field label="শিরোনাম" required error={errors.title?.message}><Input maxLength={150} {...form.register("title")} /></Field>
      <Field label="বিবরণ" error={errors.description?.message}><Textarea rows={4} {...form.register("description")} /></Field>
      <Field label="লক্ষ্যমাত্রা (৳, ঐচ্ছিক)" error={errors.goal_amount?.message}><Input inputMode="decimal" {...form.register("goal_amount")} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">সক্রিয় (সবাই দেখতে পাবে)</span><Switch checked={form.watch("is_active")} onCheckedChange={(c) => form.setValue("is_active", c, { shouldDirty: true })} /></label>
    </FormDialog>
  );
}

const CSV_COLUMNS = (campaigns: Campaign[]): CsvColumn<Donation>[] => [
  { header: "দাতা", value: (d) => d.donor_name }, { header: "ফোন", value: (d) => d.donor_phone }, { header: "ইমেইল", value: (d) => d.donor_email },
  { header: "পরিমাণ", value: (d) => d.amount }, { header: "ক্যাম্পেইন", value: (d) => campaigns.find((c) => c.id === d.campaign_id)?.title ?? "সাধারণ" },
  { header: "মাধ্যম", value: (d) => d.payment_method }, { header: "ট্রানজেকশন", value: (d) => d.transaction_id },
  { header: "অবস্থা", value: (d) => STATUS[d.status]?.label ?? d.status }, { header: "উদ্দেশ্য", value: (d) => d.purpose }, { header: "তারিখ", value: (d) => d.created_at },
];

export default function DonationsSection({ adminId }: { adminId: string }) {
  const confirm = useConfirm();
  const { data: donations = [], isLoading } = useAdminRows("donations", "created_at");
  const { data: campaigns = [] } = useAdminRows("donation_campaigns", "created_at");
  const donationMut = useRowMutations("donations");
  const campaignMut = useRowMutations("donation_campaigns");

  const [tab, setTab] = useState("donations");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Donation | null>(null);
  const [campaignTarget, setCampaignTarget] = useState<Campaign | "new" | null>(null);

  const approved = donations.filter((d) => d.status === "approved");
  const pending = donations.filter((d) => d.status === "pending");
  const sum = (list: Donation[]) => list.reduce((t, d) => t + Number(d.amount), 0);
  const raisedBy = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of approved) if (d.campaign_id) map.set(d.campaign_id, (map.get(d.campaign_id) ?? 0) + Number(d.amount));
    return map;
  }, [approved]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations.filter((d) => (status === "all" || d.status === status) && (!q || `${d.donor_name} ${d.donor_phone ?? ""} ${d.donor_email ?? ""} ${d.transaction_id ?? ""}`.toLowerCase().includes(q)));
  }, [donations, status, search]);

  const setDonationStatus = (d: Donation, next: "approved" | "rejected") =>
    attempt(donationMut.update.mutateAsync({ id: d.id, values: { status: next } }), next === "approved" ? "অনুদান অনুমোদিত হয়েছে" : "অনুদান প্রত্যাখ্যাত হয়েছে");

  const destroyDonation = async (d: Donation) => {
    if (await confirm({ title: "অনুদানের রেকর্ড মুছবেন?", description: `${d.donor_name}-এর ${formatTaka(Number(d.amount))} অনুদানের রেকর্ড স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) await attempt(donationMut.remove.mutateAsync(d.id), "অনুদান মুছে ফেলা হয়েছে");
  };
  const destroyCampaign = async (c: Campaign) => {
    if (await confirm({ title: "ক্যাম্পেইনটি মুছবেন?", description: `“${c.title}” মুছে যাবে। এর অনুদানগুলো “সাধারণ তহবিল”-এ চলে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) await attempt(campaignMut.remove.mutateAsync(c.id), "ক্যাম্পেইন মুছে ফেলা হয়েছে");
  };

  const columns: Column<Donation>[] = [
    { key: "donor", header: "দাতা", primary: true, cell: (d) => <div className="min-w-0"><p className="truncate font-medium">{d.donor_name}</p><p className="truncate text-xs text-muted-foreground">{d.donor_phone || d.donor_email || "—"}</p></div> },
    { key: "amount", header: "পরিমাণ", cell: (d) => <span className="font-display font-bold">{formatTaka(Number(d.amount))}</span> },
    { key: "campaign", header: "ক্যাম্পেইন", cell: (d) => campaigns.find((c) => c.id === d.campaign_id)?.title ?? "সাধারণ তহবিল" },
    { key: "method", header: "মাধ্যম", cell: (d) => <span className="text-sm">{d.payment_method || "—"}{d.transaction_id ? <span className="block text-xs text-muted-foreground">#{d.transaction_id}</span> : null}</span> },
    { key: "status", header: "অবস্থা", cell: (d) => <StatusBadge tone={STATUS[d.status]?.tone ?? "neutral"} label={STATUS[d.status]?.label ?? d.status} /> },
    { key: "date", header: "তারিখ", hideOnMobile: true, cell: (d) => formatDate(d.created_at) },
  ];

  return (
    <div>
      <SectionHeader
        title="অনুদান ব্যবস্থাপনা" description="অনুদান অনুমোদন করলে তা ক্যাম্পেইনের অগ্রগতিতে যোগ হবে।"
        actions={tab === "donations"
          ? <Button variant="outline" className="gap-2" disabled={donations.length === 0} onClick={() => downloadCSV(`nabarun-donations-${todayStamp()}.csv`, visible, CSV_COLUMNS(campaigns))}><Download className="h-4 w-4" /> CSV</Button>
          : <Button className="gap-2" onClick={() => setCampaignTarget("new")}><Plus className="h-4 w-4" /> নতুন ক্যাম্পেইন</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Wallet, label: "অনুমোদিত মোট অনুদান", value: formatTaka(sum(approved)), tone: "bg-primary/10 text-primary" },
          { icon: Clock, label: "অপেক্ষমান", value: `${pending.length}টি · ${formatTaka(sum(pending))}`, tone: "bg-amber-500/15 text-amber-600" },
          { icon: HandCoins, label: "মোট রেকর্ড", value: `${donations.length}টি`, tone: "bg-secondary text-primary" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="truncate font-display text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
          <TabsTrigger value="donations" className="gap-2">অনুদান <CountBubble count={pending.length} className="ml-0" /></TabsTrigger>
          <TabsTrigger value="campaigns">ক্যাম্পেইন ({campaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-0">
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="নাম, ফোন বা ট্রানজেকশন আইডি…" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-44" aria-label="অবস্থা"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">সব অবস্থা</SelectItem>{Object.entries(STATUS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Toolbar>
          {isLoading ? <ListSkeleton /> : visible.length === 0 ? (
            <EmptyState icon={HandCoins} title="কোনো অনুদান পাওয়া যায়নি" description={donations.length === 0 ? "অনুদান পেজ থেকে কেউ জমা দিলে এখানে দেখা যাবে।" : "ফিল্টার বদলে দেখুন।"} />
          ) : (
            <ResponsiveTable
              rows={visible} columns={columns} rowKey={(d) => d.id}
              actions={(d) => (
                <>
                  {d.status !== "approved" && <ActionButton icon={CheckCircle2} label="অনুমোদন" tone="success" onClick={() => setDonationStatus(d, "approved")} />}
                  {d.status !== "rejected" && <ActionButton icon={XCircle} label="প্রত্যাখ্যান" onClick={() => setDonationStatus(d, "rejected")} />}
                  <ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setEditing(d)} />
                  <ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroyDonation(d)} />
                </>
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-0">
          {campaigns.length === 0 ? (
            <EmptyState icon={Target} title="কোনো ক্যাম্পেইন নেই" description="নির্দিষ্ট লক্ষ্যে অনুদান সংগ্রহ করতে ক্যাম্পেইন তৈরি করুন।" action={<Button className="gap-2" onClick={() => setCampaignTarget("new")}><Plus className="h-4 w-4" /> ক্যাম্পেইন তৈরি করুন</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {campaigns.map((c) => {
                const raised = raisedBy.get(c.id) ?? 0;
                const pct = c.goal_amount ? Math.min(100, Math.round((raised / Number(c.goal_amount)) * 100)) : null;
                return (
                  <article key={c.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="font-display font-semibold leading-snug">{c.title}</h3>{c.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{excerpt(c.description, 140)}</p>}</div>
                      <StatusBadge tone={c.is_active ? "approved" : "neutral"} label={c.is_active ? "সক্রিয়" : "বন্ধ"} />
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{formatTaka(raised)}</span><span className="text-muted-foreground">{c.goal_amount ? `লক্ষ্য ${formatTaka(Number(c.goal_amount))}` : "লক্ষ্য নির্ধারিত নেই"}</span></div>
                      {pct !== null && <><Progress value={pct} className="h-2" /><p className="mt-1 text-right text-xs text-muted-foreground">{pct}%</p></>}
                    </div>
                    <div className="mt-3 flex items-center gap-1 border-t pt-2">
                      <Switch checked={!!c.is_active} aria-label="সক্রিয়" onCheckedChange={(v) => attempt(campaignMut.update.mutateAsync({ id: c.id, values: { is_active: v } }), v ? "ক্যাম্পেইন সক্রিয়" : "ক্যাম্পেইন বন্ধ")} />
                      <div className="ml-auto flex"><ActionButton icon={Pencil} label="সম্পাদনা" onClick={() => setCampaignTarget(c)} /><ActionButton icon={Trash2} label="মুছুন" tone="danger" onClick={() => destroyCampaign(c)} /></div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DonationDialog donation={editing} campaigns={campaigns} onClose={() => setEditing(null)} />
      <CampaignDialog target={campaignTarget} adminId={adminId} onClose={() => setCampaignTarget(null)} />
    </div>
  );
}
