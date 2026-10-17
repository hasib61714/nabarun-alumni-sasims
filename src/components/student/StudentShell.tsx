import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Home, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/lib/format";
import { safeHttpsUrl } from "@/lib/memories";
import { cn } from "@/lib/utils";
import nabarunLogo from "@/assets/nabarun-logo.png";
import { STUDENT_SECTIONS, type StudentSectionId } from "./studentSections";

export interface ShellUser {
  name: string;
  email: string;
  photo: string | null;
  approved: boolean;
}

interface Props {
  section: StudentSectionId;
  onSectionChange: (id: StudentSectionId) => void;
  user: ShellUser;
  /** dot on "Profile" while the profile is incomplete, and a count on "Memories" for memories that need attention */
  incomplete: boolean;
  needsAttention: number;
  onLogout: () => void;
  children: ReactNode;
}

function Indicator({ id, incomplete, needsAttention }: { id: StudentSectionId; incomplete: boolean; needsAttention: number }) {
  if (id === "profile" && incomplete) return <span className="h-2 w-2 rounded-full bg-accent" aria-label="অসম্পূর্ণ" />;
  if (id === "memories" && needsAttention > 0) {
    return <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground">{needsAttention}</span>;
  }
  return null;
}

export function StudentShell({ section, onSectionChange, user, incomplete, needsAttention, onLogout, children }: Props) {
  const current = STUDENT_SECTIONS.find((s) => s.id === section) ?? STUDENT_SECTIONS[0];
  const photo = safeHttpsUrl(user.photo);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* desktop sidebar */}
      <aside aria-label="মেনু" className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-4 pb-3 pt-5">
          <Link to="/" className="block rounded-xl bg-white p-2.5 shadow-sm"><img src={nabarunLogo} alt="Nabarun Education Family" className="mx-auto h-9 w-auto" /></Link>
        </div>
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
          <Avatar className="h-11 w-11 border-2 border-white/30">
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback className="bg-white/20 font-semibold text-white">{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="inline-flex items-center gap-1 text-xs text-sidebar-foreground/80">
              {user.approved ? <><CheckCircle2 className="h-3 w-3" /> অনুমোদিত</> : <><Clock className="h-3 w-3" /> অনুমোদনের অপেক্ষায়</>}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="ড্যাশবোর্ড মেনু">
          {STUDENT_SECTIONS.map((s) => {
            const active = s.id === section;
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
                <span className="ml-auto"><Indicator id={s.id} incomplete={incomplete} needsAttention={needsAttention} /></span>
              </button>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Button asChild variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><Link to="/"><Home className="h-[18px] w-[18px]" /> ওয়েবসাইট দেখুন</Link></Button>
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-[18px] w-[18px]" /> লগআউট</Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur-xl sm:px-6">
          <Link to="/" className="lg:hidden" aria-label="হোম"><img src={nabarunLogo} alt="" className="h-8 w-auto" /></Link>
          <div className="flex min-w-0 items-center gap-2.5">
            <current.icon className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-semibold leading-tight">{current.label}</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{current.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onLogout} aria-label="লগআউট"><LogOut className="h-5 w-5" /></Button>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:py-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* phone / tablet bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="ড্যাশবোর্ড মেনু">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {STUDENT_SECTIONS.map((s) => {
            const active = s.id === section;
            return (
              <li key={s.id}>
                <button
                  type="button" onClick={() => onSectionChange(s.id)} aria-current={active ? "page" : undefined}
                  className={cn("relative flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", active ? "text-primary" : "text-muted-foreground")}
                >
                  <span className={cn("relative flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/10")}>
                    <s.icon className="h-5 w-5" />
                    <span className="absolute -right-0.5 -top-0.5"><Indicator id={s.id} incomplete={incomplete} needsAttention={needsAttention} /></span>
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
