import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard from "./student/Dashboard";
import AdminDashboard from "./admin/Dashboard";
import SuperAdminDashboard from "./admin/SuperAdminDashboard";

export default function DashboardRouter() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"super_admin" | "admin" | "student" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const uid = session.user.id;

      const { data: isSuperAdmin } = await supabase.rpc("has_role", {
        _user_id: uid,
        _role: "super_admin",
      });

      if (isSuperAdmin) {
        setRole("super_admin");
        setLoading(false);
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: uid,
        _role: "admin",
      });

      setRole(isAdmin ? "admin" : "student");
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (role === "super_admin") return <SuperAdminDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <StudentDashboard />;
}
