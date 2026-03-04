import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard from "./student/Dashboard";
import AdminDashboard from "./admin/Dashboard";

export default function DashboardRouter() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "student" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      setRole(isAdmin ? "admin" : "student");
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (role === "admin") return <AdminDashboard />;
  return <StudentDashboard />;
}
