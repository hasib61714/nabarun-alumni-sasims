import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, BookHeart, Loader2, PenLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { MemoryCard, MemoryCardSkeleton } from "@/components/memories/MemoryCard";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useMemoryBatches, usePublicMemories } from "@/hooks/useMemories";
import { useLang } from "@/lib/i18n";
import { categoryLabel, MEMORY_CATEGORIES } from "@/lib/memories";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Memories() {
  const { t, lang } = useLang();
  usePageMeta(t("স্মৃতির পাতা", "Memories"), t("নবারুণের দিনগুলোর গল্প, ছবি আর ভিডিও।", "Stories, photos and videos from the Nabarun days."));
  const { user } = useAuthUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [batch, setBatch] = useState("all");
  const debouncedSearch = useDebounced(search);

  const memories = usePublicMemories({ search: debouncedSearch, category, batch });
  const batches = useMemoryBatches();
  const items = memories.data?.pages.flat() ?? [];
  const filtering = debouncedSearch !== "" || category !== "all" || batch !== "all";

  useEffect(() => { document.title = t("স্মৃতির পাতা — নবারুণ অ্যালামনাই", "Memories — Nabarun Alumni"); }, [t]);

  const writeLink = user ? "/dashboard?tab=memories&new=1" : "/login";

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient py-14 sm:py-20">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90">
              <BookHeart className="h-4 w-4" /> {t("প্রাক্তনদের কলমে", "In our alumni's words")}
            </span>
            <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">{t("স্মৃতির পাতা", "Memories")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-white/80 sm:text-lg">
              {t("নবারুণের দিনগুলোর গল্প, ছবি আর ভিডিও — আমাদের প্রাক্তন ও বর্তমান ছাত্রদের নিজের কথায়।", "Stories, photos and videos from the Nabarun days, in the own words of our alumni and current students.")}
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-7 gap-2 font-semibold shadow-elevated">
              <Link to={writeLink}><PenLine className="h-4 w-4" /> {t("আপনার স্মৃতি লিখুন", "Write your memory")}</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        <div className="mx-auto mb-8 max-w-3xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("শিরোনাম, লেখা বা লেখকের নাম দিয়ে খুঁজুন…", "Search by title, text or author…")}
                className="h-11 pl-10" aria-label={t("স্মৃতি খুঁজুন", "Search memories")}
              />
            </div>
            {(batches.data?.length ?? 0) > 0 && (
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="h-11 sm:w-40" aria-label={t("ব্যাচ", "Batch")}><SelectValue placeholder={t("ব্যাচ", "Batch")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("সকল ব্যাচ", "All batches")}</SelectItem>
                  {batches.data!.map((b) => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0" role="tablist" aria-label={t("বিভাগ", "Category")}>
            {["all", ...MEMORY_CATEGORIES].map((c) => (
              <button
                key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                  category === c ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {c === "all" ? t("সব", "All") : categoryLabel(c, lang)}
              </button>
            ))}
          </div>
        </div>

        {memories.isError ? (
          <EmptyState
            icon={AlertTriangle} title={t("স্মৃতিগুলো লোড করা যায়নি", "Could not load the memories")} description={t("ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।", "Check your internet connection and try again.")}
            action={<Button onClick={() => memories.refetch()}>{t("আবার চেষ্টা করুন", "Try again")}</Button>}
          />
        ) : memories.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <MemoryCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookHeart}
            title={filtering ? t("কোনো স্মৃতি পাওয়া যায়নি", "No memories found") : t("এখনো কোনো স্মৃতি প্রকাশিত হয়নি", "No memories have been published yet")}
            description={filtering ? t("অন্য শব্দে বা অন্য বিভাগে খুঁজে দেখুন।", "Try different words or another category.") : t("আপনিই প্রথম স্মৃতিটি লিখুন — নবারুণের কোনো সুন্দর মুহূর্ত সবার সাথে ভাগ করে নিন।", "Be the first to write one — share a beautiful moment from Nabarun with everyone.")}
            action={
              filtering
                ? <Button variant="outline" onClick={() => { setSearch(""); setCategory("all"); setBatch("all"); }}>{t("ফিল্টার মুছুন", "Clear filters")}</Button>
                : <Button asChild><Link to={writeLink}><PenLine className="mr-2 h-4 w-4" /> {t("স্মৃতি লিখুন", "Write a memory")}</Link></Button>
            }
          />
        ) : (
          <>
            <h2 className="sr-only">{t("প্রকাশিত স্মৃতি", "Published memories")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m, i) => <MemoryCard key={m.id} memory={m} to={`/memories/${m.id}`} index={i % 9} />)}
            </div>
            {memories.hasNextPage && (
              <div className="mt-10 text-center">
                <Button variant="outline" size="lg" onClick={() => memories.fetchNextPage()} disabled={memories.isFetchingNextPage}>
                  {memories.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("আরও স্মৃতি দেখুন", "Load more memories")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
