import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Filter } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  category: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "অনুষ্ঠান": "bg-primary/10 text-primary border-primary/20",
  "পরীক্ষা": "bg-accent/10 text-accent border-accent/20",
  "সভা": "bg-secondary text-secondary-foreground border-secondary",
  "খেলাধুলা": "bg-primary/15 text-primary border-primary/30",
  "অন্যান্য": "bg-muted text-muted-foreground border-border",
};

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: true });
    setEvents((data as EventRow[]) || []);
    setLoading(false);
  };

  const categories = [...new Set(events.map((e) => e.category))];
  const eventDates = events.map((e) => parseISO(e.event_date));

  const filtered = events.filter((e) => {
    const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
    const matchesDate = !selectedDate || isSameDay(parseISO(e.event_date), selectedDate);
    return matchesCat && matchesDate;
  });

  // Split into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = filtered.filter((e) => parseISO(e.event_date) >= today);
  const past = filtered.filter((e) => parseISO(e.event_date) < today);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMMM yyyy, EEEE", { locale: bn });
    } catch {
      return dateStr;
    }
  };

  const renderEventCard = (event: EventRow, idx: number) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
              <span className="text-lg font-bold leading-none">{format(parseISO(event.event_date), "d")}</span>
              <span className="text-[10px] font-medium">{format(parseISO(event.event_date), "MMM", { locale: bn })}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-base">{event.title}</h3>
                <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[event.category] || CATEGORY_COLORS["অন্যান্য"])}>
                  {event.category}
                </Badge>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.event_date)}
                </span>
                {event.event_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {event.event_time.slice(0, 5)}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">📅 ইভেন্ট ক্যালেন্ডার</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">নবারুণ এডুকেশন ফ্যামিলির আসন্ন ও বিগত অনুষ্ঠানসমূহ</p>
      </motion.div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        {/* Sidebar: Calendar + Filter */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d === selectedDate ? undefined : d)}
                className={cn("p-3 pointer-events-auto")}
                modifiers={{ hasEvent: eventDates }}
                modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold text-primary" }}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedDate && (
            <button onClick={() => setSelectedDate(undefined)} className="text-xs text-primary hover:underline">
              তারিখ ফিল্টার মুছুন
            </button>
          )}
        </div>

        {/* Main: Event List */}
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">কোনো ইভেন্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" /> আসন্ন ইভেন্ট
                  </h2>
                  <div className="space-y-3">{upcoming.map(renderEventCard)}</div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" /> বিগত ইভেন্ট
                  </h2>
                  <div className="space-y-3 opacity-70">{past.map(renderEventCard)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
