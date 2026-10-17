import { lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_SECTIONS, type SectionId } from "@/components/admin/adminSections";
import DonationsSection from "@/components/admin/sections/DonationsSection";
import EventsSection from "@/components/admin/sections/EventsSection";
import GallerySection from "@/components/admin/sections/GallerySection";
import MemoriesSection from "@/components/admin/sections/MemoriesSection";
import MessagesSection from "@/components/admin/sections/MessagesSection";
import NoticesSection from "@/components/admin/sections/NoticesSection";
import OverviewSection from "@/components/admin/sections/OverviewSection";
import StudentsSection from "@/components/admin/sections/StudentsSection";
import TestimonialsSection from "@/components/admin/sections/TestimonialsSection";
import { ListSkeleton } from "@/components/admin/AdminCommon";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAdminCounts } from "@/hooks/useAdminData";

// charts are heavy, so they load only when that tab is opened
const AnalyticsSection = lazy(() => import("@/components/admin/sections/AnalyticsSection"));

const isSection = (value: string | null): value is SectionId => ADMIN_SECTIONS.some((s) => s.id === value);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const access = useAdminAccess();
  const [params, setParams] = useSearchParams();
  const { data: counts } = useAdminCounts(access.status === "ok");

  const tab = params.get("tab");
  const section: SectionId = isSection(tab) ? tab : "overview";
  const go = (id: SectionId) => {
    setParams({ tab: id }, { replace: false });
    window.scrollTo({ top: 0 });
  };

  if (access.status === "loading") {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" role="status" aria-label="লোড হচ্ছে" /></div>;
  }

  const adminId = access.user.id;
  const logout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  return (
    <AdminShell section={section} onSectionChange={go} counts={counts} isSuperAdmin={access.isSuperAdmin} onLogout={logout}>
      {section === "overview" && <OverviewSection onNavigate={go} />}
      {section === "students" && <StudentsSection />}
      {section === "memories" && <MemoriesSection adminId={adminId} />}
      {section === "gallery" && <GallerySection adminId={adminId} />}
      {section === "events" && <EventsSection adminId={adminId} />}
      {section === "notices" && <NoticesSection adminId={adminId} />}
      {section === "donations" && <DonationsSection adminId={adminId} />}
      {section === "testimonials" && <TestimonialsSection />}
      {section === "messages" && <MessagesSection />}
      {section === "analytics" && <Suspense fallback={<ListSkeleton rows={3} />}><AnalyticsSection /></Suspense>}
    </AdminShell>
  );
}
