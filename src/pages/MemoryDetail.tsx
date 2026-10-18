import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookHeart, CalendarDays, Link2, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { MediaCarousel } from "@/components/memories/MemoryMedia";
import { useMemory, useRecentMemories } from "@/hooks/useMemories";
import { excerpt, formatDate, initialsOf } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { categoryLabel, statusLabel } from "@/lib/memories";

export default function MemoryDetail() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const { data: memory, isLoading, isError, refetch } = useMemory(id);
  const more = useRecentMemories(3, id);

  useEffect(() => {
    if (memory) document.title = `${memory.title} — ${t("স্মৃতির পাতা", "Memories")}`;
    return () => { document.title = t("নবারুণ অ্যালামনাই - SASIMS", "Nabarun Alumni - SASIMS"); };
  }, [memory, t]);

  const share = async () => {
    if (!memory) return;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: memory.title, text: excerpt(memory.body, 100), url });
      else { await navigator.clipboard.writeText(url); toast.success(t("লিংক কপি হয়েছে", "Link copied")); }
    } catch { /* the user closed the share sheet */ }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success(t("লিংক কপি হয়েছে", "Link copied")); }
    catch { toast.error(t("লিংক কপি করা যায়নি", "Could not copy the link")); }
  };

  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-muted-foreground">
        <Link to="/memories"><ArrowLeft className="h-4 w-4" /> {t("সব স্মৃতি", "All memories")}</Link>
      </Button>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-3/4" /><Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {isError && (
        <EmptyState icon={BookHeart} title={t("স্মৃতিটি লোড করা যায়নি", "Could not load this memory")} action={<Button onClick={() => refetch()}>{t("আবার চেষ্টা করুন", "Try again")}</Button>} />
      )}

      {!isLoading && !isError && !memory && (
        <EmptyState
          icon={BookHeart} title={t("স্মৃতিটি পাওয়া যায়নি", "Memory not found")} description={t("লিংকটি ভুল হতে পারে, অথবা স্মৃতিটি এখনো প্রকাশিত হয়নি।", "The link may be wrong, or the memory has not been published yet.")}
          action={<Button asChild><Link to="/memories">{t("স্মৃতির পাতায় ফিরুন", "Back to Memories")}</Link></Button>}
        />
      )}

      {memory && (
        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {memory.status !== "approved" && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <StatusBadge tone={memory.status === "rejected" ? "rejected" : "pending"} label={statusLabel(memory.status, lang)} />
              {t("এটি শুধু আপনি (বা অ্যাডমিন) দেখতে পাচ্ছেন — এখনো সবার জন্য প্রকাশিত নয়।", "Only you (or an admin) can see this — it is not published for everyone yet.")}
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{categoryLabel(memory.category, lang)}</Badge>
            {memory.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                <Star className="h-3 w-3 fill-current" /> {t("বিশেষ স্মৃতি", "Featured memory")}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{memory.title}</h1>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initialsOf(memory.author_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{memory.author_name}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {memory.batch_year && <span>{t("ব্যাচ", "Batch")} {memory.batch_year}</span>}
                  {memory.batch_year && <span aria-hidden>·</span>}
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(memory.approved_at ?? memory.created_at, lang)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copy} className="gap-1.5"><Link2 className="h-4 w-4" /> {t("লিংক", "Link")}</Button>
              <Button size="sm" onClick={share} className="gap-1.5"><Share2 className="h-4 w-4" /> {t("শেয়ার", "Share")}</Button>
            </div>
          </div>

          {memory.media.length > 0 && <div className="mt-6"><MediaCarousel media={memory.media} title={memory.title} /></div>}

          <div className="mt-8 whitespace-pre-line break-words text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9">{memory.body}</div>
        </motion.article>
      )}

      {memory && (more.data?.length ?? 0) > 0 && (
        <section className="mt-16 border-t pt-10">
          <h2 className="mb-6 font-display text-2xl font-bold">{t("আরও স্মৃতি", "More memories")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:-mx-12 xl:-mx-24">
            {more.data!.map((m, i) => <MemoryCard key={m.id} memory={m} to={`/memories/${m.id}`} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
