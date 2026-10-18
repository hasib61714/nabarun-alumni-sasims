import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotices } from "@/hooks/useStudentData";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NoticesSection() {
  const { data: notices = [], isLoading, isError, refetch } = useNotices(50);
  const [open, setOpen] = useState<string | null>(null);

  if (isLoading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (isError) return <EmptyState icon={Bell} title="নোটিশ লোড করা যায়নি" action={<Button onClick={() => refetch()}>আবার চেষ্টা করুন</Button>} />;
  if (notices.length === 0) return <EmptyState icon={Bell} title="এখনো কোনো নোটিশ নেই" description="নতুন ঘোষণা এলে এখানে দেখতে পাবেন।" />;

  return (
    <ul className="space-y-3">
      {notices.map((n) => {
        const expanded = open === n.id;
        return (
          <li key={n.id} className="overflow-hidden rounded-xl border bg-card shadow-card">
            <button type="button" onClick={() => setOpen(expanded ? null : n.id)} aria-expanded={expanded} className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Bell className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold leading-snug">{n.title}</span>
                <span className="text-xs text-muted-foreground">{formatDate(n.created_at)} · {timeAgo(n.created_at)}</span>
              </span>
              <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && <div className="whitespace-pre-line break-words border-t bg-muted/30 px-4 py-4 text-sm leading-7 sm:pl-16">{n.content}</div>}
          </li>
        );
      })}
    </ul>
  );
}
