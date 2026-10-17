import { useMemo, useState } from "react";
import { Download, Mail, MailOpen, MessageSquare, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt, useAdminRows, useRowMutations, type Row } from "@/hooks/useAdminData";
import { downloadCSV, todayStamp, type CsvColumn } from "@/lib/export";
import { excerpt, formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListSkeleton, SearchInput, SectionHeader, Toolbar } from "../AdminCommon";

type Message = Row<"contact_messages">;

const CSV_COLUMNS: CsvColumn<Message>[] = [
  { header: "নাম", value: (m) => m.name }, { header: "ইমেইল", value: (m) => m.email }, { header: "বিষয়", value: (m) => m.subject },
  { header: "বার্তা", value: (m) => m.message }, { header: "পঠিত", value: (m) => (m.is_read ? "হ্যাঁ" : "না") }, { header: "তারিখ", value: (m) => m.created_at },
];

export default function MessagesSection() {
  const confirm = useConfirm();
  const { data: messages = [], isLoading } = useAdminRows("contact_messages", "created_at");
  const { update, updateMany, remove } = useRowMutations("contact_messages");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const open = messages.find((m) => m.id === openId) ?? null;
  const unread = messages.filter((m) => !m.is_read);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => (!onlyUnread || !m.is_read) && (!q || `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q)));
  }, [messages, onlyUnread, search]);

  const openMessage = (m: Message) => {
    setOpenId(m.id);
    if (!m.is_read) void update.mutateAsync({ id: m.id, values: { is_read: true } });
  };

  const markAllRead = () => attempt(updateMany.mutateAsync({ ids: unread.map((m) => m.id), values: { is_read: true } }), "সব বার্তা পঠিত হিসেবে চিহ্নিত হয়েছে");

  const destroy = async (m: Message) => {
    if (await confirm({ title: "বার্তাটি মুছে ফেলবেন?", description: `${m.name}-এর বার্তা স্থায়ীভাবে মুছে যাবে।`, confirmLabel: "মুছে ফেলুন", destructive: true })) {
      if (await attempt(remove.mutateAsync(m.id), "বার্তা মুছে ফেলা হয়েছে")) setOpenId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="যোগাযোগ বার্তা" description={`মোট ${messages.length}টি · অপঠিত ${unread.length}টি`}
        actions={<>
          {unread.length > 0 && <Button variant="outline" className="gap-2" onClick={markAllRead} disabled={updateMany.isPending}><MailOpen className="h-4 w-4" /> সব পঠিত</Button>}
          <Button variant="outline" className="gap-2" disabled={messages.length === 0} onClick={() => downloadCSV(`nabarun-messages-${todayStamp()}.csv`, messages, CSV_COLUMNS)}><Download className="h-4 w-4" /> CSV</Button>
        </>}
      />
      <Toolbar>
        <div className="flex gap-2">
          {[{ v: false, l: "সব" }, { v: true, l: `অপঠিত (${unread.length})` }].map((o) => (
            <button key={String(o.v)} type="button" onClick={() => setOnlyUnread(o.v)} aria-pressed={onlyUnread === o.v} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", onlyUnread === o.v ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/50")}>{o.l}</button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="নাম, ইমেইল বা বিষয়…" />
      </Toolbar>

      {isLoading ? <ListSkeleton /> : visible.length === 0 ? (
        <EmptyState icon={MessageSquare} title={messages.length === 0 ? "এখনো কোনো বার্তা আসেনি" : "কোনো বার্তা পাওয়া যায়নি"} description={messages.length === 0 ? "যোগাযোগ ফর্ম থেকে বার্তা এলে এখানে দেখা যাবে।" : undefined} />
      ) : (
        <ul className="space-y-2">
          {visible.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => openMessage(m)} className={cn("flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", !m.is_read && "border-primary/40 bg-primary/5")}>
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", m.is_read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>{m.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><span className={cn("truncate", !m.is_read && "font-semibold")}>{m.name}</span><span className="shrink-0 text-xs text-muted-foreground">{timeAgo(m.created_at)}</span></span>
                  <span className={cn("block truncate text-sm", !m.is_read ? "font-medium" : "text-muted-foreground")}>{m.subject}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground line-clamp-1">{excerpt(m.message, 120)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          {open && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="font-display leading-snug">{open.subject}</DialogTitle>
                <DialogDescription>{open.name} · <a className="text-primary hover:underline" href={`mailto:${encodeURIComponent(open.email)}`}>{open.email}</a><br />{formatDateTime(open.created_at)}</DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-line break-words rounded-lg bg-muted/50 p-4 text-sm leading-7">{open.message}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="gap-2"><a href={`mailto:${encodeURIComponent(open.email)}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}><Reply className="h-4 w-4" /> উত্তর দিন</a></Button>
                <Button variant="outline" className="gap-2" onClick={() => attempt(update.mutateAsync({ id: open.id, values: { is_read: false } }), "অপঠিত হিসেবে চিহ্নিত হয়েছে").then(() => setOpenId(null))}><Mail className="h-4 w-4" /> অপঠিত করুন</Button>
                <Button variant="ghost" className="ml-auto gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => destroy(open)}><Trash2 className="h-4 w-4" /> মুছুন</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
