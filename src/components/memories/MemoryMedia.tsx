import { useEffect, useRef, useState } from "react";
import { BookHeart, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { safeMediaUrl, type MemoryMedia } from "@/lib/memories";
import { parseYouTube, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/video";

const PlayBadge = () => (
  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm">
      <Play className="ml-0.5 h-5 w-5 fill-current" />
    </span>
  </span>
);

/** Square/landscape preview of one media item (used on cards and in the uploader). */
export function MediaThumb({ media, alt, className }: { media: MemoryMedia | null; alt: string; className?: string }) {
  const url = media ? safeMediaUrl(media.url) : null;
  const youtubeId = media?.type === "youtube" ? parseYouTube(media.url) : null;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {media && url && media.type === "image" && (
        <img src={url} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      )}
      {media && url && media.type === "video" && (
        <>
          <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" aria-label={alt} />
          <PlayBadge />
        </>
      )}
      {youtubeId && (
        <>
          <img src={youtubeThumbnailUrl(youtubeId)} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <PlayBadge />
        </>
      )}
      {!media && (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-accent/10">
          <BookHeart className="h-10 w-10 text-primary/60" />
        </div>
      )}
    </div>
  );
}

/** Swipeable viewer for all photos and videos of a memory. Photos open in a lightbox. */
export function MediaCarousel({ media, title }: { media: MemoryMedia[]; title: string }) {
  const { t } = useLang();
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setIndex(api.selectedScrollSnap());
      // stop any playing video when sliding away
      root.current?.querySelectorAll("video").forEach((v) => v.pause());
      root.current?.querySelectorAll("iframe").forEach((frame) => {
        frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
      });
    };
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (media.length === 0) return null;

  return (
    <div ref={root} className="relative overflow-hidden rounded-2xl bg-black shadow-elevated">
      <Carousel setApi={setApi} opts={{ align: "start" }}>
        <CarouselContent className="ml-0">
          {media.map((m, i) => {
            const url = safeMediaUrl(m.url);
            const youtubeId = m.type === "youtube" ? parseYouTube(m.url) : null;
            return (
              <CarouselItem key={`${m.url}-${i}`} className="pl-0">
                <div className="aspect-video w-full bg-black">
                  {m.type === "image" && url && (
                    <button type="button" onClick={() => setLightbox(url)} className="h-full w-full cursor-zoom-in" aria-label={t("ছবি বড় করে দেখুন", "View photo larger")}>
                      <img src={url} alt={`${title} — ${t("ছবি", "Photo")} ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain" />
                    </button>
                  )}
                  {m.type === "video" && url && (
                    <video src={url} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                  )}
                  {youtubeId && (
                    <iframe
                      src={`${youtubeEmbedUrl(youtubeId)}&enablejsapi=1`}
                      title={`${title} — ${t("ভিডিও", "Video")}`}
                      loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="h-full w-full border-0"
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {media.length > 1 && (
        <>
          <button
            type="button" onClick={() => api?.scrollPrev()} aria-label={t("আগের", "Previous")}
            className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button" onClick={() => api?.scrollNext()} aria-label={t("পরের", "Next")}
            className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
            {media.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full bg-white transition-all", i === index ? "w-4" : "w-1.5 opacity-60")} />
            ))}
          </div>
        </>
      )}

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-[96vw] border-0 bg-transparent p-0 shadow-none sm:max-w-5xl [&>button]:text-white">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {lightbox && <img src={lightbox} alt={title} className="max-h-[88dvh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
