import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, BookOpen, Award, Briefcase, LogOut, Save, Camera, Home, Linkedin, Facebook, KeyRound, Bell, CheckCircle, AlertCircle, MapPin, MessageSquareQuote, Send } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import nabarunLogo from "@/assets/nabarun-logo.png";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [testimonialMsg, setTestimonialMsg] = useState("");
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [hasSubmittedTestimonial, setHasSubmittedTestimonial] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "", roll: "", batch_year: "", result: "", achievement: "",
    current_profession: "", higher_study: "", linkedin_link: "", facebook_link: "",
    location: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      loadProfile(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else { setUser(session.user); loadProfile(session.user.id); }
    });
    loadNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkExistingTestimonial(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        roll: data.roll || "", batch_year: data.batch_year?.toString() || "",
        result: data.result || "", achievement: data.achievement || "",
        current_profession: data.current_profession || "", higher_study: data.higher_study || "",
        linkedin_link: data.linkedin_link || "", facebook_link: data.facebook_link || "",
        location: data.location || "",
      });
      if (data.photo) setPhotoUrl(data.photo);
      setIsApproved(data.is_approved ?? false);
    }
    setLoading(false);
  };

  const loadNotices = async () => {
    const { data } = await supabase.from("notices").select("id, title, content, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(5);
    setNotices((data as Notice[]) || []);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("ফাইল সাইজ ২MB এর কম হতে হবে"); return; }
    if (!file.type.startsWith("image/")) { toast.error("শুধুমাত্র ছবি আপলোড করুন"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("student_profiles").update({ photo: publicUrl }).eq("user_id", user.id);
    setPhotoUrl(publicUrl + "?t=" + Date.now());
    toast.success("ছবি আপলোড হয়েছে!");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id, full_name: profile.full_name,
      roll: profile.roll, batch_year: profile.batch_year ? parseInt(profile.batch_year) : null,
      result: profile.result, achievement: profile.achievement,
      current_profession: profile.current_profession, higher_study: profile.higher_study,
      linkedin_link: profile.linkedin_link, facebook_link: profile.facebook_link,
      location: profile.location,
    };
    const { error } = await supabase.from("student_profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("প্রোফাইল সংরক্ষিত হয়েছে!");
  };

  const handlePasswordChange = async () => {
    if (passwords.new.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    if (passwords.new !== passwords.confirm) { toast.error("পাসওয়ার্ড মিলছে না"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    setChangingPassword(false);
    if (error) toast.error(error.message);
    else { toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে!"); setPasswordDialog(false); setPasswords({ new: "", confirm: "" }); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const checkExistingTestimonial = async (userId: string) => {
    const { data } = await supabase.from("testimonials").select("id").eq("user_id", userId).maybeSingle();
    if (data) setHasSubmittedTestimonial(true);
  };

  const handleSubmitTestimonial = async () => {
    if (!user || !testimonialMsg.trim()) { toast.error("মতামত লিখুন"); return; }
    if (testimonialMsg.trim().length < 10) { toast.error("মতামত কমপক্ষে ১০ অক্ষরের হতে হবে"); return; }
    if (testimonialMsg.trim().length > 500) { toast.error("মতামত ৫০০ অক্ষরের মধ্যে হতে হবে"); return; }
    setSubmittingTestimonial(true);
    const { error } = await supabase.from("testimonials").insert({
      user_id: user.id,
      name: profile.full_name || user.user_metadata?.full_name || "অজ্ঞাত",
      batch_year: profile.batch_year ? parseInt(profile.batch_year) : null,
      profession: profile.current_profession || null,
      message: testimonialMsg.trim(),
      photo: photoUrl || null,
    });
    setSubmittingTestimonial(false);
    if (error) toast.error(error.message);
    else {
      toast.success("মতামত জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের পর প্রদর্শিত হবে।");
      setTestimonialMsg("");
      setHasSubmittedTestimonial(true);
    }
  };

  // Profile completeness
  const fields = [profile.full_name, profile.roll, profile.batch_year, profile.result, profile.current_profession];
  const filled = fields.filter((f) => f && f.trim() !== "").length;
  const completeness = Math.round((filled / fields.length) * 100);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary font-display text-xl">লোড হচ্ছে...</div>
    </div>
  );

  const initials = (profile.full_name || user?.user_metadata?.full_name || "S").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-primary">
            <img src={nabarunLogo} alt="Nabarun" className="h-8 w-auto" />
            <span className="hidden sm:inline">ছাত্র ড্যাশবোর্ড</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="mr-1 h-4 w-4" /> হোম</Link>
            </Button>
            <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><KeyRound className="mr-1 h-4 w-4" /> পাসওয়ার্ড</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">পাসওয়ার্ড পরিবর্তন</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>নতুন পাসওয়ার্ড</Label>
                    <Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} placeholder="কমপক্ষে ৬ অক্ষর" />
                  </div>
                  <div className="space-y-2">
                    <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
                    <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="আবার লিখুন" />
                  </div>
                  <Button onClick={handlePasswordChange} className="w-full" disabled={changingPassword}>
                    {changingPassword ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> লগআউট
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-elevated mb-8 overflow-hidden">
            <div className="bg-hero-gradient h-28" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    {photoUrl ? <AvatarImage src={photoUrl} alt="Profile" /> : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/40 flex items-center justify-center transition-colors cursor-pointer">
                    <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold">{profile.full_name || user?.user_metadata?.full_name || "ছাত্র"}</h1>
                    {isApproved ? (
                      <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> অনুমোদিত</Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> অপেক্ষমান</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  {profile.batch_year && <p className="text-sm text-primary font-medium mt-1">ব্যাচ {profile.batch_year} · রোল: {profile.roll || "—"}</p>}
                </div>
              </div>
              {/* Profile completeness */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">প্রোফাইল সম্পূর্ণতা</span>
                  <span className="font-semibold text-primary">{completeness}%</span>
                </div>
                <Progress value={completeness} className="h-2" />
                {completeness < 100 && <p className="text-xs text-muted-foreground mt-1">সব তথ্য পূরণ করলে অনুমোদন দ্রুত হবে।</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notices */}
        {notices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-accent" /> সাম্প্রতিক নোটিশ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notices.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-accent mt-0.5">📌</span>
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("bn-BD")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> ব্যক্তিগত তথ্য</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>পূর্ণ নাম</Label>
                  <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="আপনার পূর্ণ নাম" />
                </div>
                <div className="space-y-2">
                  <Label>রোল নম্বর</Label>
                  <Input value={profile.roll} onChange={(e) => setProfile({ ...profile, roll: e.target.value })} placeholder="যেমন: ১০১" />
                </div>
                <div className="space-y-2">
                  <Label>ব্যাচ বছর</Label>
                  <Input value={profile.batch_year} onChange={(e) => setProfile({ ...profile, batch_year: e.target.value })} placeholder="যেমন: ২০২০" type="number" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-primary" /> একাডেমিক ফলাফল</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={profile.result} onChange={(e) => setProfile({ ...profile, result: e.target.value })} placeholder="SSC: GPA 5.0, HSC: GPA 5.0, চূড়ান্ত পরীক্ষা: প্রথম শ্রেণি..." rows={3} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" /> অর্জনসমূহ</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={profile.achievement} onChange={(e) => setProfile({ ...profile, achievement: e.target.value })} placeholder="পুরস্কার, সম্মাননা, প্রতিযোগিতা..." rows={3} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" /> পেশাগত তথ্য</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>বর্তমান পেশা</Label>
                    <Input value={profile.current_profession} onChange={(e) => setProfile({ ...profile, current_profession: e.target.value })} placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার" />
                  </div>
                  <div className="space-y-2">
                    <Label>উচ্চশিক্ষা</Label>
                    <Input value={profile.higher_study} onChange={(e) => setProfile({ ...profile, higher_study: e.target.value })} placeholder="যেমন: MSc in CSE, BUET" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> অবস্থান</Label>
                  <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="যেমন: ঢাকা, বাংলাদেশ" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</Label>
                    <Input value={profile.linkedin_link} onChange={(e) => setProfile({ ...profile, linkedin_link: e.target.value })} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" /> Facebook</Label>
                    <Input value={profile.facebook_link} onChange={(e) => setProfile({ ...profile, facebook_link: e.target.value })} placeholder="https://facebook.com/..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Testimonial */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><MessageSquareQuote className="h-5 w-5 text-primary" /> আপনার মতামত</CardTitle>
              </CardHeader>
              <CardContent>
                {hasSubmittedTestimonial ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">আপনার মতামত জমা দেওয়া হয়েছে। অ্যাডমিন অনুমোদনের পর হোম পেজে প্রদর্শিত হবে।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">নবারুণ সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন। অনুমোদনের পর হোম পেজে দেখানো হবে।</p>
                    <Textarea
                      value={testimonialMsg}
                      onChange={(e) => setTestimonialMsg(e.target.value)}
                      placeholder="নবারুণ আমার জীবনে যে প্রভাব ফেলেছে..."
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{testimonialMsg.length}/৫০০</span>
                      <Button onClick={handleSubmitTestimonial} disabled={submittingTestimonial} size="sm">
                        <Send className="mr-1 h-4 w-4" /> {submittingTestimonial ? "জমা হচ্ছে..." : "মতামত জমা দিন"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Button onClick={handleSave} size="lg" className="w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সংরক্ষণ করুন"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
