import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toProfileRow, type ProfileFormValues, type StudentProfile } from "@/lib/profile";

/** The signed-in user; sends visitors who are not signed in to the login page. */
export function useRequireUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate]);

  return { user, loading };
}

const profileKey = (userId?: string) => ["student", "profile", userId];

export function useStudentProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<StudentProfile | null> => {
      const { data, error } = await supabase.from("student_profiles").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const { error } = await supabase.from("student_profiles").upsert({ user_id: userId!, ...toProfileRow(values) }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

export function useSetPhoto(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photo: string | null) => {
      const { error } = await supabase.from("student_profiles").update({ photo }).eq("user_id", userId!);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

export function useMyTestimonial(userId: string | undefined) {
  return useQuery({
    queryKey: ["student", "testimonial", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("id, message, is_approved, created_at").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNotices(limit = 30) {
  return useQuery({
    queryKey: ["notices", "published", limit],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices").select("id, title, content, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
