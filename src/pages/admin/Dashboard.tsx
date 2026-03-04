import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users, Search, LogOut, CheckCircle, XCircle, Download, BarChart3, Trash2, Home, Clock, Eye,
  Bell, Plus, Mail, MailOpen, MessageSquare, Send, Megaphone, Image as ImageIcon, Upload, CalendarDays, MapPin, HandCoins, Target, MessageSquareQuote
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import nabarunLogo from "@/assets/nabarun-logo.png";

interface StudentRow {
  user_id: string;
  full_name: string | null;
  roll: string | null;
  batch_year: number | null;
  result: string | null;
  current_profession: string | null;
  achievement: string | null;
  higher_study: string | null;
  linkedin_link: string | null;
  facebook_link: string | null;
  photo: string | null;
  is_approved: boolean;
  created_at: string;
}

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

interface GalleryPhoto {
  id: string;
  title: string;
  description: string | null;
  photo_url: string;
  event_name: string | null;
  batch_year: number | null;
  is_published: boolean;
  created_at: string;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  category: string;
  is_published: boolean;
  created_at: string;
}

const EVENT_CATEGORIES = ["অনুষ্ঠান", "পরীক্ষা", "সভা", "খেলাধুলা", "অন্যান্য"];

interface TestimonialRow {
  id: string;
  name: string;
  batch_year: number | null;
  profession: string | null;
  message: string;
  photo: string | null;
  is_approved: boolean;
  created_at: string;
}

const CHART_COLORS = [
  "hsl(185, 75%, 40%)", "hsl(185, 65%, 55%)", "hsl(0, 85%, 55%)",
  "hsl(40, 90%, 52%)", "hsl(195, 50%, 45%)", "hsl(160, 60%, 40%)",
  "hsl(280, 50%, 50%)", "hsl(30, 80%, 50%)",
];

interface DonationRow {
  id: string;
  donor_name: string;
  donor_email: string | null;
  donor_phone: string | null;
  amount: number;
  purpose: string | null;
  campaign_id: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CampaignRow {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Contact messages
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<ContactMsg | null>(null);

  // Notices
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: "", content: "" });
  const [addingNotice, setAddingNotice] = useState(false);

  // Gallery
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [newPhoto, setNewPhoto] = useState({ title: "", description: "", event_name: "", batch_year: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Events
  const [events, setEvents] = useState<EventRow[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", event_date: "", event_time: "", location: "", category: "অনুষ্ঠান" });
  const [addingEvent, setAddingEvent] = useState(false);

  // Donations
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [newCampaign, setNewCampaign] = useState({ title: "", description: "", goal_amount: "" });
  const [addingCampaign, setAddingCampaign] = useState(false);

  // Testimonials
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  useEffect(() => {
    checkAdmin();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
    if (!data) { toast.error("অ্যাক্সেস প্রত্যাখ্যাত"); navigate("/dashboard"); }
  };

  const loadAll = () => { loadStudents(); loadMessages(); loadNotices(); loadGallery(); loadEvents(); loadDonations(); loadTestimonials(); };

  const loadStudents = async () => {
    const { data, error } = await supabase.from("student_profiles").select("*");
    if (error) { toast.error(error.message); setLoading(false); return; }
    const mapped: StudentRow[] = (data || []).map((s) => ({
      user_id: s.user_id, full_name: s.full_name, roll: s.roll, batch_year: s.batch_year,
      result: s.result, current_profession: s.current_profession, achievement: s.achievement,
      higher_study: s.higher_study, linkedin_link: s.linkedin_link, facebook_link: s.facebook_link,
      photo: s.photo, is_approved: s.is_approved ?? false, created_at: s.created_at,
    }));
    setStudents(mapped);
    setLoading(false);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMessages((data as ContactMsg[]) || []);
  };

  const loadNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    setNotices((data as Notice[]) || []);
  };

  const loadGallery = async () => {
    const { data } = await supabase.from("gallery_photos").select("*").order("created_at", { ascending: false });
    setGalleryPhotos((data as GalleryPhoto[]) || []);
  };

  const uploadGalleryPhoto = async () => {
    if (!photoFile || !newPhoto.title) { toast.error("শিরোনাম ও ছবি দিন"); return; }
    setUploadingPhoto(true);
    const ext = photoFile.name.split(".").pop();
    const filePath = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("gallery").upload(filePath, photoFile);
    if (uploadErr) { toast.error(uploadErr.message); setUploadingPhoto(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(filePath);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("gallery_photos").insert({
      title: newPhoto.title,
      description: newPhoto.description || null,
      event_name: newPhoto.event_name || null,
      batch_year: newPhoto.batch_year ? parseInt(newPhoto.batch_year) : null,
      photo_url: publicUrl,
      uploaded_by: session?.user.id,
      is_published: true,
    });
    setUploadingPhoto(false);
    if (error) toast.error(error.message);
    else {
      toast.success("ছবি আপলোড হয়েছে");
      setNewPhoto({ title: "", description: "", event_name: "", batch_year: "" });
      setPhotoFile(null);
      loadGallery();
    }
  };

  const deleteGalleryPhoto = async (photo: GalleryPhoto) => {
    if (!confirm("ছবি মুছে ফেলবেন?")) return;
    // Extract file path from URL
    const urlParts = photo.photo_url.split("/gallery/");
    if (urlParts[1]) {
      await supabase.storage.from("gallery").remove([urlParts[1]]);
    }
    await supabase.from("gallery_photos").delete().eq("id", photo.id);
    toast.success("ছবি মুছে ফেলা হয়েছে");
    loadGallery();
  };

  const togglePhotoPublish = async (id: string, publish: boolean) => {
    await supabase.from("gallery_photos").update({ is_published: publish }).eq("id", id);
    loadGallery();
  };

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    setEvents((data as EventRow[]) || []);
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) { toast.error("শিরোনাম ও তারিখ দিন"); return; }
    setAddingEvent(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("events").insert({
      title: newEvent.title,
      description: newEvent.description || null,
      event_date: newEvent.event_date,
      event_time: newEvent.event_time || null,
      location: newEvent.location || null,
      category: newEvent.category,
      is_published: true,
      created_by: session?.user.id,
    });
    setAddingEvent(false);
    if (error) toast.error(error.message);
    else {
      toast.success("ইভেন্ট যুক্ত হয়েছে");
      setNewEvent({ title: "", description: "", event_date: "", event_time: "", location: "", category: "অনুষ্ঠান" });
      loadEvents();
    }
  };

  const toggleEventPublish = async (id: string, publish: boolean) => {
    await supabase.from("events").update({ is_published: publish }).eq("id", id);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("ইভেন্ট মুছে ফেলা হয়েছে");
    loadEvents();
  };

  const loadDonations = async () => {
    const { data: d } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    setDonations(d || []);
    const { data: c } = await supabase.from("donation_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(c || []);
  };

  const addCampaign = async () => {
    if (!newCampaign.title) { toast.error("শিরোনাম দিন"); return; }
    setAddingCampaign(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("donation_campaigns").insert({
      title: newCampaign.title,
      description: newCampaign.description || null,
      goal_amount: newCampaign.goal_amount ? Number(newCampaign.goal_amount) : null,
      is_active: true,
      created_by: session?.user.id,
    });
    setAddingCampaign(false);
    if (error) toast.error(error.message);
    else { toast.success("ক্যাম্পেইন তৈরি হয়েছে"); setNewCampaign({ title: "", description: "", goal_amount: "" }); loadDonations(); }
  };

  const updateDonationStatus = async (id: string, status: string) => {
    await supabase.from("donations").update({ status }).eq("id", id);
    toast.success(`অনুদান ${status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে`);
    loadDonations();
  };

  const deleteDonation = async (id: string) => {
    await supabase.from("donations").delete().eq("id", id);
    toast.success("অনুদান মুছে ফেলা হয়েছে");
    loadDonations();
  };

  const toggleCampaign = async (id: string, active: boolean) => {
    await supabase.from("donation_campaigns").update({ is_active: active }).eq("id", id);
    loadDonations();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("donation_campaigns").delete().eq("id", id);
    toast.success("ক্যাম্পেইন মুছে ফেলা হয়েছে");
    loadDonations();
  };

  const loadTestimonials = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setTestimonials((data as TestimonialRow[]) || []);
  };

  const toggleTestimonialApproval = async (id: string, approve: boolean) => {
    await supabase.from("testimonials").update({ is_approved: approve }).eq("id", id);
    toast.success(approve ? "টেস্টিমোনিয়াল অনুমোদিত" : "অনুমোদন প্রত্যাহার");
    loadTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("টেস্টিমোনিয়াল মুছে ফেলবেন?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("টেস্টিমোনিয়াল মুছে ফেলা হয়েছে");
    loadTestimonials();
  };

  const toggleApproval = async (userId: string, approve: boolean) => {
    const { error } = await supabase.from("student_profiles").update({ is_approved: approve }).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success(approve ? "ছাত্র অনুমোদিত" : "অনুমোদন প্রত্যাহার"); loadStudents(); }
  };

  const bulkApprove = async (approve: boolean) => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await supabase.from("student_profiles").update({ is_approved: approve }).eq("user_id", id);
    }
    toast.success(`${selectedIds.size} জন ছাত্র ${approve ? "অনুমোদিত" : "প্রত্যাহার"} হয়েছে`);
    setSelectedIds(new Set());
    loadStudents();
  };

  const deleteStudent = async (userId: string) => {
    if (!confirm("আপনি কি নিশ্চিত?")) return;
    const { error } = await supabase.from("student_profiles").delete().eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("ছাত্র মুছে ফেলা হয়েছে"); loadStudents(); }
  };

  const markMsgRead = async (msg: ContactMsg) => {
    if (!msg.is_read) await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
    setSelectedMsg({ ...msg, is_read: true });
    loadMessages();
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("contact_messages").delete().eq("id", id);
    toast.success("বার্তা মুছে ফেলা হয়েছে");
    setSelectedMsg(null);
    loadMessages();
  };

  const addNotice = async () => {
    if (!newNotice.title || !newNotice.content) { toast.error("শিরোনাম ও বিষয়বস্তু দিন"); return; }
    setAddingNotice(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("notices").insert({
      title: newNotice.title, content: newNotice.content, is_published: true, created_by: session?.user.id,
    });
    setAddingNotice(false);
    if (error) toast.error(error.message);
    else { toast.success("নোটিশ যুক্ত হয়েছে"); setNewNotice({ title: "", content: "" }); loadNotices(); }
  };

  const toggleNoticePublish = async (id: string, publish: boolean) => {
    await supabase.from("notices").update({ is_published: publish }).eq("id", id);
    loadNotices();
  };

  const deleteNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    toast.success("নোটিশ মুছে ফেলা হয়েছে");
    loadNotices();
  };

  const exportCSV = () => {
    const headers = ["নাম", "রোল", "ব্যাচ", "পেশা", "ফলাফল", "অর্জন", "উচ্চশিক্ষা", "অনুমোদিত"];
    const rows = filtered.map((s) => [s.full_name, s.roll, s.batch_year, s.current_profession, s.result, s.achievement, s.higher_study, s.is_approved ? "হ্যাঁ" : "না"].join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nabarun_students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const batches = [...new Set(students.map((s) => s.batch_year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (s.roll || "").toLowerCase().includes(q) || (s.full_name || "").toLowerCase().includes(q);
    const matchesBatch = batchFilter === "all" || s.batch_year?.toString() === batchFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "approved" ? s.is_approved : !s.is_approved);
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const approvedCount = students.filter((s) => s.is_approved).length;
  const pendingCount = students.length - approvedCount;
  const unreadMsgs = messages.filter((m) => !m.is_read).length;

  const batchChartData = batches.map((b) => ({ batch: `${b}`, count: students.filter((s) => s.batch_year === b).length }));
  const statusData = [{ name: "অনুমোদিত", value: approvedCount }, { name: "অপেক্ষমান", value: pendingCount }];

  const professionCounts: Record<string, number> = {};
  students.forEach((s) => { const p = s.current_profession || "অনির্ধারিত"; professionCounts[p] = (professionCounts[p] || 0) + 1; });
  const professionChartData = Object.entries(professionCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((s) => s.user_id)));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-primary font-display text-xl">লোড হচ্ছে...</div></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-primary">
            <img src={nabarunLogo} alt="Nabarun" className="h-8 w-auto" />
            <span className="hidden sm:inline">অ্যাডমিন ড্যাশবোর্ড</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="mr-1 h-4 w-4" /> হোম</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> লগআউট
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Users, label: "মোট ছাত্র", value: students.length, color: "bg-primary/10 text-primary" },
            { icon: CheckCircle, label: "অনুমোদিত", value: approvedCount, color: "bg-secondary text-primary" },
            { icon: Clock, label: "অপেক্ষমান", value: pendingCount, color: "bg-accent/15 text-accent" },
            { icon: BarChart3, label: "মোট ব্যাচ", value: batches.length, color: "bg-primary/10 text-primary" },
            { icon: Mail, label: "অপঠিত বার্তা", value: unreadMsgs, color: "bg-accent/15 text-accent" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto w-full max-w-4xl">
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" /> ছাত্র</TabsTrigger>
            <TabsTrigger value="gallery"><ImageIcon className="h-4 w-4 mr-1" /> গ্যালারি</TabsTrigger>
            <TabsTrigger value="events"><CalendarDays className="h-4 w-4 mr-1" /> ইভেন্ট</TabsTrigger>
            <TabsTrigger value="donations"><HandCoins className="h-4 w-4 mr-1" /> অনুদান</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" /> পরিসংখ্যান</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="h-4 w-4 mr-1" /> বার্তা
              {unreadMsgs > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center">{unreadMsgs}</span>}
            </TabsTrigger>
            <TabsTrigger value="notices"><Megaphone className="h-4 w-4 mr-1" /> নোটিশ</TabsTrigger>
            <TabsTrigger value="testimonials"><MessageSquareQuote className="h-4 w-4 mr-1" /> টেস্টিমোনিয়াল</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="shadow-card">
              <CardContent className="flex flex-col sm:flex-row gap-3 p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="নাম বা রোল দিয়ে খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ব্যাচ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল ব্যাচ</SelectItem>
                    {batches.map((b) => <SelectItem key={b} value={b!.toString()}>ব্যাচ {b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="অবস্থা" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল অবস্থা</SelectItem>
                    <SelectItem value="approved">অনুমোদিত</SelectItem>
                    <SelectItem value="pending">অপেক্ষমান</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
              </CardContent>
            </Card>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">{selectedIds.size} জন নির্বাচিত</span>
                <Button size="sm" variant="default" onClick={() => bulkApprove(true)}><CheckCircle className="mr-1 h-4 w-4" /> অনুমোদন</Button>
                <Button size="sm" variant="secondary" onClick={() => bulkApprove(false)}><XCircle className="mr-1 h-4 w-4" /> প্রত্যাহার</Button>
              </div>
            )}

            <Card className="shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={selectAll} />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>রোল</TableHead>
                    <TableHead>ব্যাচ</TableHead>
                    <TableHead className="hidden md:table-cell">পেশা</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.user_id} className="group">
                      <TableCell>
                        <Checkbox checked={selectedIds.has(s.user_id)} onCheckedChange={() => toggleSelect(s.user_id)} />
                      </TableCell>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          {s.photo ? <AvatarImage src={s.photo} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {(s.full_name || s.roll || "?")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{s.full_name || "—"}</TableCell>
                      <TableCell>{s.roll || "—"}</TableCell>
                      <TableCell>{s.batch_year || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.current_profession || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_approved ? "default" : "secondary"}>
                          {s.is_approved ? "অনুমোদিত" : "অপেক্ষমান"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(s)} title="বিস্তারিত"><Eye className="h-4 w-4" /></Button>
                          {!s.is_approved ? (
                            <Button size="sm" variant="ghost" onClick={() => toggleApproval(s.user_id, true)} title="অনুমোদন"><CheckCircle className="h-4 w-4 text-primary" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => toggleApproval(s.user_id, false)} title="প্রত্যাহার"><XCircle className="h-4 w-4 text-accent" /></Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteStudent(s.user_id)} title="মুছুন"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        কোনো ছাত্র পাওয়া যায়নি।
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base font-display">নতুন ছবি আপলোড</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>শিরোনাম *</Label>
                    <Input value={newPhoto.title} onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })} placeholder="ছবির শিরোনাম" />
                  </div>
                  <div className="space-y-2">
                    <Label>ইভেন্ট</Label>
                    <Input value={newPhoto.event_name} onChange={(e) => setNewPhoto({ ...newPhoto, event_name: e.target.value })} placeholder="যেমন: বার্ষিক সভা ২০২৫" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>বিবরণ</Label>
                    <Input value={newPhoto.description} onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })} placeholder="সংক্ষিপ্ত বিবরণ" />
                  </div>
                  <div className="space-y-2">
                    <Label>ব্যাচ বছর</Label>
                    <Input value={newPhoto.batch_year} onChange={(e) => setNewPhoto({ ...newPhoto, batch_year: e.target.value })} placeholder="যেমন: 2022" type="number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ছবি নির্বাচন করুন *</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={uploadGalleryPhoto} disabled={uploadingPhoto}>
                  <Upload className="mr-2 h-4 w-4" /> {uploadingPhoto ? "আপলোড হচ্ছে..." : "আপলোড করুন"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden shadow-card">
                  <div className="aspect-square relative">
                    <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-semibold line-clamp-1">{photo.title}</p>
                    {photo.event_name && <p className="text-xs text-muted-foreground">{photo.event_name}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`gpub-${photo.id}`} className="text-xs">প্রকাশ</Label>
                        <Switch id={`gpub-${photo.id}`} checked={photo.is_published} onCheckedChange={(v) => togglePhotoPublish(photo.id, v)} />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteGalleryPhoto(photo)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {galleryPhotos.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  কোনো ছবি নেই। উপরে থেকে আপলোড করুন।
                </div>
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base font-display">নতুন ইভেন্ট যোগ করুন</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>শিরোনাম *</Label>
                    <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="ইভেন্টের শিরোনাম" />
                  </div>
                  <div className="space-y-2">
                    <Label>ক্যাটাগরি</Label>
                    <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>তারিখ *</Label>
                    <Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>সময়</Label>
                    <Input type="time" value={newEvent.event_time} onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>স্থান</Label>
                    <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="যেমন: স্কুল মাঠ" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>বিবরণ</Label>
                  <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="ইভেন্টের বিস্তারিত..." rows={3} />
                </div>
                <Button onClick={addEvent} disabled={addingEvent}>
                  <Plus className="mr-2 h-4 w-4" /> {addingEvent ? "যুক্ত হচ্ছে..." : "ইভেন্ট যোগ করুন"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {events.map((ev) => (
                <Card key={ev.id} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{ev.title}</h3>
                          <Badge variant="outline">{ev.category}</Badge>
                          <Badge variant={ev.is_published ? "default" : "secondary"}>
                            {ev.is_published ? "প্রকাশিত" : "ড্রাফট"}
                          </Badge>
                        </div>
                        {ev.description && <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {ev.event_date}</span>
                          {ev.event_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ev.event_time.slice(0, 5)}</span>}
                          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {ev.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`epub-${ev.id}`} className="text-xs">প্রকাশ</Label>
                          <Switch id={`epub-${ev.id}`} checked={ev.is_published} onCheckedChange={(v) => toggleEventPublish(ev.id, v)} />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteEvent(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  কোনো ইভেন্ট নেই
                </div>
              )}
            </div>
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations" className="space-y-6">
            {/* Create Campaign */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base font-display">নতুন ক্যাম্পেইন তৈরি</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>শিরোনাম *</Label>
                    <Input value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="ক্যাম্পেইনের নাম" />
                  </div>
                  <div className="space-y-2">
                    <Label>বিবরণ</Label>
                    <Input value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="সংক্ষিপ্ত বিবরণ" />
                  </div>
                  <div className="space-y-2">
                    <Label>লক্ষ্য (৳)</Label>
                    <Input type="number" value={newCampaign.goal_amount} onChange={(e) => setNewCampaign({ ...newCampaign, goal_amount: e.target.value })} placeholder="50000" />
                  </div>
                </div>
                <Button onClick={addCampaign} disabled={addingCampaign}>
                  <Target className="mr-2 h-4 w-4" /> {addingCampaign ? "তৈরি হচ্ছে..." : "ক্যাম্পেইন তৈরি"}
                </Button>
              </CardContent>
            </Card>

            {/* Campaigns List */}
            {campaigns.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display font-semibold">ক্যাম্পেইন তালিকা</h3>
                {campaigns.map((c: CampaignRow) => (
                  <Card key={c.id} className="shadow-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{c.title}</p>
                        {c.goal_amount && <p className="text-xs text-muted-foreground">লক্ষ্য: ৳{Number(c.goal_amount).toLocaleString()}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">সক্রিয়</Label>
                          <Switch checked={c.is_active} onCheckedChange={(v) => toggleCampaign(c.id, v)} />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Donations List */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base font-display">অনুদান তালিকা ({donations.length})</CardTitle></CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HandCoins className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    কোনো অনুদান নেই
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>নাম</TableHead>
                        <TableHead>পরিমাণ</TableHead>
                        <TableHead>মাধ্যম</TableHead>
                        <TableHead>TxID</TableHead>
                        <TableHead>অবস্থা</TableHead>
                        <TableHead className="text-right">কার্যক্রম</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((d: DonationRow) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{d.donor_name}</p>
                              {d.donor_phone && <p className="text-xs text-muted-foreground">{d.donor_phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">৳{Number(d.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{d.payment_method}</TableCell>
                          <TableCell className="text-xs font-mono">{d.transaction_id || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>
                              {d.status === "approved" ? "অনুমোদিত" : d.status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমান"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {d.status === "pending" && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => updateDonationStatus(d.id, "approved")} title="অনুমোদন">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => updateDonationStatus(d.id, "rejected")} title="প্রত্যাখ্যান">
                                    <XCircle className="h-4 w-4 text-accent" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => deleteDonation(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="shadow-card lg:col-span-2">
                <CardHeader><CardTitle className="text-base font-display">ব্যাচ অনুযায়ী ছাত্র সংখ্যা</CardTitle></CardHeader>
                <CardContent>
                  {batchChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={batchChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="batch" fontSize={12} />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Bar dataKey="count" fill="hsl(185, 75%, 40%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground">তথ্য নেই</div>}
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-base font-display">অনুমোদনের অবস্থা</CardTitle></CardHeader>
                <CardContent>
                  {students.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {statusData.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(185, 75%, 40%)" : "hsl(0, 85%, 55%)"} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground">তথ্য নেই</div>}
                </CardContent>
              </Card>
            </div>
            {professionChartData.length > 0 && (
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-base font-display">পেশা অনুযায়ী বিভাজন</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={professionChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={12} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {professionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    কোনো বার্তা নেই
                  </div>
                ) : messages.map((m) => (
                  <Card key={m.id} className={`shadow-card cursor-pointer transition-colors hover:bg-muted/50 ${!m.is_read ? "border-primary/30 bg-primary/5" : ""} ${selectedMsg?.id === m.id ? "ring-2 ring-primary" : ""}`} onClick={() => markMsgRead(m)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        {!m.is_read ? <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" /> : <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.subject}</p>
                          <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("bn-BD")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="lg:col-span-2">
                {selectedMsg ? (
                  <Card className="shadow-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-lg">{selectedMsg.subject}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{selectedMsg.name} · {selectedMsg.email}</p>
                          <p className="text-xs text-muted-foreground">{new Date(selectedMsg.created_at).toLocaleString("bn-BD")}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteMsg(selectedMsg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{selectedMsg.message}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>একটি বার্তা নির্বাচন করুন</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Notices Tab */}
          <TabsContent value="notices" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> নতুন নোটিশ যুক্ত করুন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>শিরোনাম</Label>
                  <Input value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="নোটিশের শিরোনাম" />
                </div>
                <div className="space-y-2">
                  <Label>বিষয়বস্তু</Label>
                  <Textarea value={newNotice.content} onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })} placeholder="নোটিশের বিস্তারিত..." rows={4} />
                </div>
                <Button onClick={addNotice} disabled={addingNotice}>
                  <Send className="mr-2 h-4 w-4" /> {addingNotice ? "যুক্ত হচ্ছে..." : "প্রকাশ করুন"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {notices.map((n) => (
                <Card key={n.id} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{n.title}</h3>
                          <Badge variant={n.is_published ? "default" : "secondary"}>
                            {n.is_published ? "প্রকাশিত" : "ড্রাফট"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString("bn-BD")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`pub-${n.id}`} className="text-xs">প্রকাশ</Label>
                          <Switch id={`pub-${n.id}`} checked={n.is_published} onCheckedChange={(v) => toggleNoticePublish(n.id, v)} />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteNotice(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {notices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  কোনো নোটিশ নেই
                </div>
              )}
            </div>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5" /> টেস্টিমোনিয়াল ব্যবস্থাপনা
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {testimonials.map((t) => (
                <Card key={t.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{t.name}</p>
                          <Badge variant={t.is_approved ? "default" : "secondary"}>
                            {t.is_approved ? "অনুমোদিত" : "অপেক্ষমান"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {t.profession && <span>{t.profession}</span>}
                          {t.profession && t.batch_year && <span> • </span>}
                          {t.batch_year && <span>ব্যাচ {t.batch_year}</span>}
                        </p>
                        <p className="text-sm italic">&ldquo;{t.message}&rdquo;</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(t.created_at).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`tapprove-${t.id}`} className="text-xs">অনুমোদন</Label>
                          <Switch
                            id={`tapprove-${t.id}`}
                            checked={t.is_approved}
                            onCheckedChange={(v) => toggleTestimonialApproval(t.id, v)}
                          />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteTestimonial(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {testimonials.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquareQuote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  কোনো টেস্টিমোনিয়াল নেই
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">ছাত্রের বিস্তারিত তথ্য</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {selectedStudent.photo ? <AvatarImage src={selectedStudent.photo} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {(selectedStudent.full_name || selectedStudent.roll || "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedStudent.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">রোল: {selectedStudent.roll || "—"} · ব্যাচ: {selectedStudent.batch_year || "—"}</p>
                  <Badge variant={selectedStudent.is_approved ? "default" : "secondary"} className="mt-1">
                    {selectedStudent.is_approved ? "অনুমোদিত" : "অপেক্ষমান"}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                {[
                  { label: "পেশা", value: selectedStudent.current_profession },
                  { label: "ফলাফল", value: selectedStudent.result },
                  { label: "অর্জন", value: selectedStudent.achievement },
                  { label: "উচ্চশিক্ষা", value: selectedStudent.higher_study },
                  { label: "LinkedIn", value: selectedStudent.linkedin_link },
                  { label: "Facebook", value: selectedStudent.facebook_link },
                ].map((item) => (
                  <div key={item.label} className="flex gap-2">
                    <span className="font-medium text-muted-foreground w-24 shrink-0">{item.label}:</span>
                    <span className="break-all">{item.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
