import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Images, Star, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { excerpt, initialsOf, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { categoryLabel, coverOf, type Memory } from "@/lib/memories";
import { MediaThumb } from "./MemoryMedia";

interface Props {
  memory: Memory;
  to: string;
  index?: number;
}

export function MemoryCard({ memory, to, index = 0 }: Props) {
  const { t, lang } = useLang();
  const cover = coverOf(memory);
  const photos = memory.media.filter((m) => m.type === "image").length;
  const hasVideo = memory.media.some((m) => m.type !== "image");

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
      className="h-full"
    >
      <Link
        to={to}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative">
          <MediaThumb media={cover} alt={memory.title} className="aspect-[4/3] w-full" />
          <Badge className="absolute left-3 top-3 border-0 bg-black/55 text-white backdrop-blur-sm hover:bg-black/55">{categoryLabel(memory.category, lang)}</Badge>
          {memory.is_featured && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950 shadow">
              <Star className="h-3 w-3 fill-current" /> {t("বিশেষ", "Featured")}
            </span>
          )}
          {(photos > 1 || hasVideo) && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {photos > 1 && <span className="inline-flex items-center gap-1"><Images className="h-3.5 w-3.5" />{photos}</span>}
              {hasVideo && <Video className="h-3.5 w-3.5" aria-label={t("ভিডিও আছে", "Has video")} />}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">{memory.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{excerpt(memory.body, 160)}</p>
          <div className="mt-4 flex items-center gap-2.5 border-t pt-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(memory.author_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-foreground">{memory.author_name}</p>
              <p className="truncate text-muted-foreground">
                {memory.batch_year ? `${t("ব্যাচ", "Batch")} ${memory.batch_year} · ` : ""}{timeAgo(memory.approved_at ?? memory.created_at, lang)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function MemoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-2 pt-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
