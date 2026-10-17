import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "pending" | "approved" | "rejected" | "neutral";

const TONES: Record<Tone, { className: string; icon: LucideIcon }> = {
  pending: { className: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300", icon: Clock },
  approved: { className: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { className: "border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300", icon: XCircle },
  neutral: { className: "border-border bg-muted text-muted-foreground", icon: Clock },
};

export function StatusBadge({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  const { className: toneClass, icon: Icon } = TONES[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", toneClass, className)}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
