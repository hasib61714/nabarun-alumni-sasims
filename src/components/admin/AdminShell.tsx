import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, KeyRound, LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/common/ChangePasswordDialog";
import { initialsOf } from "@/lib/format";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminCounts } from "@/hooks/useAdminData";
import nabarunLogo from "@/assets/nabarun-logo.png";
import { CountBubble } from "./AdminCommon";
import { ADMIN_SECTIONS, type SectionId } from "./adminSections";

interface Props {
  section: SectionId;
  onSectionChange: (id: SectionId) => void;
  counts?: AdminCounts;
  isSuperAdmin: boolean;
  adminName: string;
  onLogout: () => void;
  children: ReactNode;
}

function NavContent({ section, onSectionChange, counts, isSuperAdmin, adminName, onLogout, onChangePassword }: Omit<Props, "children"> & { onChangePassword: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 pb-3 pt-5">
        <Link to="/" className="block rounded-xl bg-white p-2.5 shadow-sm">
          <img src={nabarunLogo} alt="Nabarun Education Family" className="mx-auto h-9 w-auto" />
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2.5">
          <Avatar className="h-9 w-9 border border-white/30"><AvatarFallback className="bg-white/20 text-xs font-semibold text-white">{initialsOf(adminName, "A")}</AvatarFallback></Avatar>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{adminName}</p><p className="truncate text-xs text-sidebar-foreground/95">{isSuperAdmin ? "সুপার অ্যাডমিন" : "অ্যাডমিন"}</p></div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="অ্যাডমিন মেনু">
        {ADMIN_SECTIONS.filter((s) => !s.superOnly || isSuperAdmin).map((s) => {
          const active = s.id === section;
          const badge = s.badge ? counts?.[s.badge] : undefined;
          return (
            <button
              key={s.id} type="button" onClick={() => onSectionChange(s.id)} aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/90 hover:bg-sidebar-accent",
              )}
            >
              <s.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{s.label}</span>
              <CountBubble count={badge} />
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <Button variant="ghost" onClick={onChangePassword} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <KeyRound className="h-[18px] w-[18px]" /> পাসওয়ার্ড পরিবর্তন
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <Link to="/"><Home className="h-[18px] w-[18px]" /> ওয়েবসাইট দেখুন</Link>
        </Button>
        <Button variant="ghost" onClick={onLogout} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-[18px] w-[18px]" /> লগআউট
        </Button>
      </div>
    </div>
  );
}

export function AdminShell({ children, ...nav }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const current = ADMIN_SECTIONS.find((s) => s.id === nav.section) ?? ADMIN_SECTIONS[0];
  const pendingTotal = nav.counts ? nav.counts.pendingStudents + nav.counts.pendingMemories + nav.counts.pendingTestimonials + nav.counts.pendingDonations + nav.counts.unreadMessages : 0;

  const select = (id: SectionId) => { nav.onSectionChange(id); setDrawerOpen(false); };

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <NavContent {...nav} onSectionChange={select} onChangePassword={() => { setDrawerOpen(false); setPasswordOpen(true); }} />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0 [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">অ্যাডমিন মেনু</SheetTitle>
          <SheetDescription className="sr-only">অ্যাডমিন প্যানেলের বিভাগসমূহ</SheetDescription>
          <NavContent {...nav} onSectionChange={select} onChangePassword={() => { setDrawerOpen(false); setPasswordOpen(true); }} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur-xl sm:px-6">
          <Button variant="ghost" size="icon" className="relative lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="মেনু খুলুন">
            <Menu className="h-5 w-5" />
            {pendingTotal > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />}
          </Button>
          <div className="flex items-center gap-2.5 min-w-0">
            <current.icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-semibold leading-tight">{current.label}</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{current.description}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={nav.section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
