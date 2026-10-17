import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, GraduationCap, Shield, ShieldCheck, ShieldOff, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/common/EmptyState";
import { ResponsiveTable, type Column } from "@/components/common/ResponsiveTable";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt } from "@/hooks/useAdminData";
import { usePagination } from "@/hooks/usePagination";
import { formatDate, initialsOf, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActionButton, ListSkeleton, Pager, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

interface Account {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
}
type Kind = "super_admin" | "admin" | "student";
type Filter = Kind | "all";

const kindOf = (a: Account): Kind => (a.roles.includes("super_admin") ? "super_admin" : a.roles.includes("admin") ? "admin" : "student");
const KIND: Record<Kind, { label: string; icon: typeof Crown; badge: string; avatar: string }> = {
  super_admin: { label: "সুপার অ্যাডমিন", icon: Crown, badge: "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300", avatar: "bg-purple-100 text-purple-700" },
  admin: { label: "অ্যাডমিন", icon: Shield, badge: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300", avatar: "bg-primary/10 text-primary" },
  student: { label: "ছাত্র", icon: GraduationCap, badge: "border-border bg-muted text-muted-foreground", avatar: "bg-muted text-muted-foreground" },
};

function RoleBadge({ kind }: { kind: Kind }) {
  const { label, icon: Icon, badge } = KIND[kind];
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", badge)}><Icon className="h-3 w-3" /> {label}</span>;
}

export default function AdminsSection({ currentUserId }: { currentUserId: string }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data: accounts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const grant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const counts = useMemo(() => ({
    all: accounts.length,
    super_admin: accounts.filter((a) => kindOf(a) === "super_admin").length,
    admin: accounts.filter((a) => kindOf(a) === "admin").length,
    student: accounts.filter((a) => kindOf(a) === "student").length,
  }), [accounts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => (filter === "all" || kindOf(a) === filter) && (!q || `${a.full_name ?? ""} ${a.email}`.toLowerCase().includes(q)));
  }, [accounts, filter, search]);
  const pager = usePagination(visible, 15);

  const makeAdmin = async (a: Account) => {
    const ok = await confirm({
      title: `${a.full_name || a.email}-কে অ্যাডমিন বানাবেন?`,
      description: "তিনি সব ছাত্র, স্মৃতি, গ্যালারি, অনুদানসহ সবকিছু দেখতে, বদলাতে ও মুছতে পারবেন। শুধু বিশ্বস্ত কাউকে দিন।",
      confirmLabel: "অ্যাডমিন বানান",
    });
    if (ok) await attempt(grant.mutateAsync(a.id), "অ্যাডমিন রোল দেওয়া হয়েছে");
  };
  const removeAdmin = async (a: Account) => {
    const ok = await confirm({
      title: `${a.full_name || a.email}-এর অ্যাডমিন অ্যাক্সেস সরাবেন?`,
      description: "তিনি আবার সাধারণ ছাত্র হয়ে যাবেন। তাঁর তথ্য ও স্মৃতি মুছবে না।",
      confirmLabel: "অ্যাক্সেস সরান",
      destructive: true,
    });
    if (ok) await attempt(revoke.mutateAsync(a.id), "অ্যাডমিন অ্যাক্সেস সরানো হয়েছে");
  };

  const columns: Column<Account>[] = [
    { key: "who", header: "ব্যবহারকারী", primary: true, cell: (a) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarFallback className={cn("text-xs font-semibold", KIND[kindOf(a)].avatar)}>{initialsOf(a.full_name || a.email)}</AvatarFallback></Avatar>
        <div className="min-w-0"><p className="truncate font-medium">{a.full_name || "নামহীন"}{a.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(আপনি)</span>}</p><p className="truncate text-xs text-muted-foreground">{a.email}</p></div>
      </div>
    ) },
    { key: "role", header: "রোল", cell: (a) => <RoleBadge kind={kindOf(a)} /> },
    { key: "joined", header: "যোগদান", cell: (a) => formatDate(a.created_at) },
    { key: "seen", header: "শেষ লগইন", hideOnMobile: true, cell: (a) => (a.last_sign_in_at ? timeAgo(a.last_sign_in_at) : "—") },
  ];

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "সকল" }, { id: "super_admin", label: "সুপার অ্যাডমিন" }, { id: "admin", label: "অ্যাডমিন" }, { id: "student", label: "ছাত্র" },
  ];

  return (
    <div>
      <SectionHeader title="অ্যাডমিন ব্যবস্থাপনা" description="কাকে অ্যাডমিন বানাবেন বা অ্যাডমিন অ্যাক্সেস সরাবেন — শুধু সুপার অ্যাডমিনরা এটি করতে পারেন।" />

      {isError ? (
        <EmptyState
          icon={ShieldOff} title="ব্যবহারকারীদের তালিকা আনা যায়নি"
          description="ডাটাবেসে এই সুবিধার আপডেট (supabase/setup/4_run_fourth.sql) এখনো চালানো না হলে এমন হয়। চালানোর পর আবার চেষ্টা করুন।"
          action={<Button onClick={() => refetch()}>আবার চেষ্টা করুন</Button>}
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: Users, label: "মোট ব্যবহারকারী", value: counts.all, tone: "bg-primary/10 text-primary" },
              { icon: Crown, label: "সুপার অ্যাডমিন", value: counts.super_admin, tone: "bg-purple-500/15 text-purple-600" },
              { icon: ShieldCheck, label: "অ্যাডমিন", value: counts.admin, tone: "bg-blue-500/15 text-blue-600" },
              { icon: GraduationCap, label: "ছাত্র", value: counts.student, tone: "bg-emerald-500/15 text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
                <div><p className="font-display text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </div>
            ))}
          </div>

          <Toolbar>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="রোল">
              {chips.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={filter === c.id} onClick={() => { setFilter(c.id); pager.setPage(1); }}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", filter === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                  {c.label} <span className={cn("rounded-full px-1.5 text-xs", filter === c.id ? "bg-primary-foreground/20" : "bg-muted")}>{counts[c.id]}</span>
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={(v) => { setSearch(v); pager.setPage(1); }} placeholder="নাম বা ইমেইল দিয়ে খুঁজুন…" />
          </Toolbar>

          {isLoading ? <ListSkeleton /> : visible.length === 0 ? (
            <EmptyState icon={Users} title="কোনো ব্যবহারকারী পাওয়া যায়নি" description="ফিল্টার বা সার্চ বদলে দেখুন।" />
          ) : (
            <>
              <ResponsiveTable
                rows={pager.pageItems} columns={columns} rowKey={(a) => a.id}
                actions={(a) => {
                  const kind = kindOf(a);
                  if (a.id === currentUserId) return <span className="px-2 text-xs text-muted-foreground">আপনার অ্যাকাউন্ট</span>;
                  if (kind === "super_admin") return <span className="inline-flex items-center gap-1 px-2 text-xs text-purple-600"><Crown className="h-3 w-3" /> সুরক্ষিত</span>;
                  if (kind === "admin") return <ActionButton showLabel icon={ShieldOff} label="অ্যাডমিন সরান" tone="danger" onClick={() => removeAdmin(a)} disabled={revoke.isPending} />;
                  return <ActionButton showLabel icon={UserPlus} label="অ্যাডমিন করুন" tone="success" onClick={() => makeAdmin(a)} disabled={grant.isPending} />;
                }}
              />
              <Pager {...pager} onPage={pager.setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
