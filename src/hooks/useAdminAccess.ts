import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Access =
  | { status: "loading" }
  | { status: "ok"; user: User; isSuperAdmin: boolean };

/** Redirects away unless the visitor is a signed-in admin. The database enforces the same rule; this is just the UX. */
export function useAdminAccess(): Access {
  const navigate = useNavigate();
  const [access, setAccess] = useState<Access>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const uid = session.user.id;
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (!active) return;
      if (!isAdmin) { toast.error("অ্যাক্সেস প্রত্যাখ্যাত"); navigate("/dashboard"); return; }
      const { data: isSuper } = await supabase.rpc("has_role", { _user_id: uid, _role: "super_admin" });
      if (active) setAccess({ status: "ok", user: session.user, isSuperAdmin: !!isSuper });
    })();
    return () => { active = false; };
  }, [navigate]);

  return access;
}
