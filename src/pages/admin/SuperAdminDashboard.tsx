import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, LogOut, Home, Search, UserPlus, Trash2,
  Crown, Shield, GraduationCap, AlertTriangle, RefreshCw, Settings,
} from "lucide-react";
import nabarunLogo from "@/assets/nabarun-logo.png";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; type: "grant_admin" | "revoke_admin" | "revoke_super"; user: UserRow | null;
  }>({ open: false, type: "grant_admin", user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const checkSuperAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "super_admin" });
    if (!data) { toast.error("সুপার অ্যাডমিন অ্যাক্সেস প্রয়োজন"); navigate("/dashboard"); }
  }, [navigate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    // Load student profiles (has user_id and full_name)
    const { data: profiles } = await supabase
      .from("student_profiles")
      .select("user_id, full_name, created_at");
    // Load all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap: Record<string, string[]> = {};
    (roles || []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const mapped: UserRow[] = (profiles || []).map((p) => ({
      id: p.user_id,
      email: "",
      full_name: p.full_name,
      created_at: p.created_at,
      roles: roleMap[p.user_id] || ["student"],
    }));

    setUsers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSuperAdmin();
    loadUsers();
  }, [checkSuperAdmin, loadUsers]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const grantAdmin = async (userId: string) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("অ্যাডমিন রোল দেওয়া হয়েছে ✓");
    setConfirmDialog({ open: false, type: "grant_admin", user: null });
    loadUsers();
  };

  const revokeRole = async (userId: string, role: "admin" | "super_admin") => {
    setActionLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${role === "admin" ? "অ্যাডমিন" : "সুপার অ্যাডমিন"} রোল সরানো হয়েছে`);
    setConfirmDialog({ open: false, type: "grant_admin", user: null });
    loadUsers();
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const superAdmins = users.filter((u) => u.roles.includes("super_admin"));
  const admins = users.filter((u) => u.roles.includes("admin") && !u.roles.includes("super_admin"));
  const students = users.filter((u) => !u.roles.includes("admin") && !u.roles.includes("super_admin"));

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes("super_admin")) return (
      <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1">
        <Crown className="h-3 w-3" /> সুপার অ্যাডমিন
      </Badge>
    );
    if (roles.includes("admin")) return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
        <Shield className="h-3 w-3" /> অ্যাডমিন
      </Badge>
    );
    return (
      <Badge variant="outline" className="gap-1">
        <GraduationCap className="h-3 w-3" /> ছাত্র
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nabarunLogo} alt="Nabarun" className="h-9 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="font-display font-bold text-sm">সুপার অ্যাডমিন প্যানেল</span>
              </div>
              <p className="text-[10px] text-muted-foreground">নবারুণ এডুকেশন ফ্যামিলি</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings className="h-4 w-4" /> অ্যাডমিন প্যানেল
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm"><Home className="h-4 w-4" /></Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "মোট ব্যবহারকারী", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "সুপার অ্যাডমিন", value: superAdmins.length, icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "অ্যাডমিন", value: admins.length, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
            { label: "ছাত্র", value: students.length, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Panel */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="h-5 w-5" /> ব্যবহারকারী ও রোল ব্যবস্থাপনা
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">অ্যাডমিন নিয়োগ ও প্রত্যাহার করুন</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="নাম বা ID দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">সকল ({filtered.length})</TabsTrigger>
                <TabsTrigger value="admins">অ্যাডমিন ({admins.length})</TabsTrigger>
                <TabsTrigger value="super">সুপার অ্যাডমিন ({superAdmins.length})</TabsTrigger>
                <TabsTrigger value="students">ছাত্র ({students.length})</TabsTrigger>
              </TabsList>

              {["all", "admins", "super", "students"].map((tab) => {
                let list = filtered;
                if (tab === "admins") list = filtered.filter((u) => u.roles.includes("admin") && !u.roles.includes("super_admin"));
                if (tab === "super") list = filtered.filter((u) => u.roles.includes("super_admin"));
                if (tab === "students") list = filtered.filter((u) => !u.roles.includes("admin") && !u.roles.includes("super_admin"));

                return (
                  <TabsContent key={tab} value={tab}>
                    {loading ? (
                      <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
                    ) : list.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>নাম</TableHead>
                            <TableHead>রোল</TableHead>
                            <TableHead>যোগদান</TableHead>
                            <TableHead className="text-right">কার্যক্রম</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.map((u) => {
                            const initials = (u.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                            const isSuperAdmin = u.roles.includes("super_admin");
                            const isAdmin = u.roles.includes("admin");
                            return (
                              <TableRow key={u.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className={`text-xs font-bold ${isSuperAdmin ? "bg-purple-100 text-purple-700" : isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{u.full_name || "অজানা"}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 12)}...</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{getRoleBadge(u.roles)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(u.created_at).toLocaleDateString("bn-BD")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {!isAdmin && !isSuperAdmin && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-primary border-primary/30 hover:bg-primary/5 h-8"
                                        onClick={() => setConfirmDialog({ open: true, type: "grant_admin", user: u })}
                                      >
                                        <UserPlus className="h-3.5 w-3.5" /> অ্যাডমিন করুন
                                      </Button>
                                    )}
                                    {isAdmin && !isSuperAdmin && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5 h-8"
                                        onClick={() => setConfirmDialog({ open: true, type: "revoke_admin", user: u })}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> অ্যাডমিন সরান
                                      </Button>
                                    )}
                                    {isSuperAdmin && (
                                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                                        <Crown className="h-3 w-3 mr-1" /> Protected
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmDialog.type === "grant_admin" ? "অ্যাডমিন নিয়োগ নিশ্চিত করুন" : "অ্যাডমিন প্রত্যাহার নিশ্চিত করুন"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "grant_admin"
                ? `"${confirmDialog.user?.full_name || "এই ব্যবহারকারী"}" কে অ্যাডমিন রোল দেওয়া হবে। তিনি সম্পূর্ণ ড্যাশবোর্ড অ্যাক্সেস পাবেন।`
                : `"${confirmDialog.user?.full_name || "এই ব্যবহারকারী"}" এর অ্যাডমিন অ্যাক্সেস বাতিল করা হবে।`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              বাতিল
            </Button>
            <Button
              className={`flex-1 ${confirmDialog.type === "revoke_admin" ? "bg-destructive hover:bg-destructive/90" : ""}`}
              disabled={actionLoading}
              onClick={() => {
                if (!confirmDialog.user) return;
                if (confirmDialog.type === "grant_admin") grantAdmin(confirmDialog.user.id);
                else revokeRole(confirmDialog.user.id, "admin");
              }}
            >
              {actionLoading ? "প্রক্রিয়া চলছে..." : "নিশ্চিত করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
