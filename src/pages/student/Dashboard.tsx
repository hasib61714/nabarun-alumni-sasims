import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MyMemories from "@/components/student/MyMemories";
import { StudentShell } from "@/components/student/StudentShell";
import { LockedSection, PendingOverview } from "@/components/student/ApprovalGate";
import NoticesSection from "@/components/student/sections/NoticesSection";
import OverviewSection from "@/components/student/sections/OverviewSection";
import ProfileSection from "@/components/student/sections/ProfileSection";
import SettingsSection from "@/components/student/sections/SettingsSection";
import { STUDENT_SECTIONS, type StudentSectionId } from "@/components/student/studentSections";
import { useMyMemories } from "@/hooks/useMemories";
import { useRequireUser, useStudentProfile } from "@/hooks/useStudentData";
import { computeCompleteness } from "@/lib/profile";

const isSection = (value: string | null): value is StudentSectionId => STUDENT_SECTIONS.some((s) => s.id === value);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useRequireUser();
  const [params, setParams] = useSearchParams();
  const { data: profile, isLoading: profileLoading } = useStudentProfile(user?.id);
  const { data: memories = [] } = useMyMemories(user?.id);

  const tab = params.get("tab");
  const section: StudentSectionId = isSection(tab) ? tab : "overview";
  const go = (id: StudentSectionId) => { setParams({ tab: id }); window.scrollTo({ top: 0 }); };

  if (loading || !user || profileLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" role="status" aria-label="লোড হচ্ছে" /></div>;
  }

  const metaName = (user.user_metadata?.full_name as string | undefined) || "ছাত্র";
  const name = profile?.full_name || metaName;
  const approved = !!profile?.is_approved;
  const locked: StudentSectionId[] = approved ? [] : ["profile", "memories"];
  const logout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  return (
    <StudentShell
      section={section} onSectionChange={go} onLogout={logout}
      user={{ name, email: user.email ?? "", photo: profile?.photo ?? null, approved }}
      incomplete={approved && computeCompleteness(profile).percent < 100}
      locked={locked}
      needsAttention={memories.filter((m) => m.status === "rejected").length}
    >
      {section === "overview" && (approved
        ? <OverviewSection userId={user.id} email={user.email ?? ""} fallbackName={metaName} onNavigate={go} />
        : <PendingOverview userId={user.id} name={name} email={user.email ?? ""} profile={profile} />)}
      {section === "profile" && (approved ? <ProfileSection user={user} /> : <LockedSection title="প্রোফাইল সম্পাদনা" onBack={() => go("overview")} />)}
      {section === "memories" && !approved && <LockedSection title="স্মৃতি লেখা" onBack={() => go("overview")} />}
      {section === "memories" && approved && <MyMemories userId={user.id} authorName={name} defaultBatch={profile?.batch_year?.toString() ?? ""} />}
      {section === "notices" && <NoticesSection />}
      {section === "settings" && <SettingsSection user={user} onLogout={logout} />}
    </StudentShell>
  );
}
