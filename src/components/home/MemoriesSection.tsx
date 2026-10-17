import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookHeart, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryCard, MemoryCardSkeleton } from "@/components/memories/MemoryCard";
import { useRecentMemories } from "@/hooks/useMemories";

export default function MemoriesSection() {
  const { data, isLoading, isError } = useRecentMemories(3);
  if (isError) return null; // never break the home page because of this section

  return (
    <section className="py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <BookHeart className="h-4 w-4" /> স্মৃতির পাতা
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">নবারুণের দিনগুলোর গল্প</h2>
          <p className="mt-3 text-muted-foreground">আমাদের প্রাক্তন ও বর্তমান ছাত্রদের লেখা স্মৃতি, ছবি আর ভিডিও।</p>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <MemoryCardSkeleton key={i} />)}</div>
        ) : data && data.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((m, i) => <MemoryCard key={m.id} memory={m} to={`/memories/${m.id}`} index={i} />)}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2"><Link to="/memories">সব স্মৃতি দেখুন <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="gap-2"><Link to="/dashboard?tab=memories&new=1"><PenLine className="h-4 w-4" /> আপনার স্মৃতি লিখুন</Link></Button>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed bg-card/60 p-8 text-center">
            <BookHeart className="mx-auto mb-3 h-10 w-10 text-primary/70" />
            <p className="font-medium">প্রথম স্মৃতিটি আপনিই লিখুন</p>
            <p className="mt-1 text-sm text-muted-foreground">নবারুণের কোনো সুন্দর মুহূর্ত ছবি বা ভিডিওসহ সবার সাথে ভাগ করে নিন।</p>
            <Button asChild className="mt-5 gap-2"><Link to="/dashboard?tab=memories&new=1"><PenLine className="h-4 w-4" /> স্মৃতি লিখুন</Link></Button>
          </div>
        )}
      </div>
    </section>
  );
}
