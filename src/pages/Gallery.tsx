import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryPhoto {
  id: string;
  title: string;
  description: string | null;
  photo_url: string;
  event_name: string | null;
  batch_year: number | null;
  created_at: string;
}

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    setPhotos((data as GalleryPhoto[]) || []);
    setLoading(false);
  };

  const events = [...new Set(photos.map((p) => p.event_name).filter(Boolean))] as string[];

  const filtered = photos.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || (p.event_name || "").toLowerCase().includes(q);
    const matchesEvent = eventFilter === "all" || p.event_name === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = () => setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : filtered.length - 1));
  const nextPhoto = () => setLightboxIdx((i) => (i !== null && i < filtered.length - 1 ? i + 1 : 0));

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">📸 ফটো গ্যালারি</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">নবারুণ এডুকেশন ফ্যামিলির স্মৃতি ও মুহূর্তগুলো</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ছবি খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {events.length > 0 && (
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="ইভেন্ট" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ইভেন্ট</SelectItem>
              {events.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">কোনো ছবি পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo, idx) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="group cursor-pointer"
              onClick={() => openLightbox(idx)}
            >
              <Card className="overflow-hidden shadow-card hover:shadow-elevated transition-shadow">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={photo.photo_url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-white text-sm font-semibold line-clamp-1">{photo.title}</p>
                    {photo.event_name && <p className="text-white/70 text-xs">{photo.event_name}</p>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxIdx !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          {lightboxIdx !== null && filtered[lightboxIdx] && (
            <div className="relative">
              <img
                src={filtered[lightboxIdx].photo_url}
                alt={filtered[lightboxIdx].title}
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-semibold">{filtered[lightboxIdx].title}</h3>
                {filtered[lightboxIdx].description && (
                  <p className="text-white/70 text-sm mt-1">{filtered[lightboxIdx].description}</p>
                )}
                {filtered[lightboxIdx].event_name && (
                  <p className="text-white/50 text-xs mt-1">{filtered[lightboxIdx].event_name} {filtered[lightboxIdx].batch_year ? `· ব্যাচ ${filtered[lightboxIdx].batch_year}` : ""}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>
                <ChevronRight className="h-8 w-8" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={closeLightbox}>
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
