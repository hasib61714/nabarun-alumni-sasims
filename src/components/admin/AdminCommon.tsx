import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-card sm:flex-row sm:items-center", className)}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10" aria-label={placeholder} />
    </div>
  );
}

interface ActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "success";
  disabled?: boolean;
  /** Show the label next to the icon (for primary actions on cards). */
  showLabel?: boolean;
}

/** Icon button with an accessible name and a tooltip. */
export function ActionButton({ icon: Icon, label, onClick, tone = "default", disabled, showLabel }: ActionProps) {
  const button = (
    <Button
      type="button" variant="ghost" size={showLabel ? "sm" : "icon"} onClick={onClick} disabled={disabled} aria-label={label}
      className={cn(
        showLabel ? "gap-1.5" : "h-8 w-8",
        tone === "danger" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        tone === "success" && "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400",
      )}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </Button>
  );
  if (showLabel) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="লোড হচ্ছে">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </div>
  );
}

export function Pager({ page, pageCount, total, pageSize, onPage }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{from}–{to} / {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="আগের পৃষ্ঠা"><ChevronLeft className="h-4 w-4" /></Button>
        <span className="min-w-14 text-center">{page} / {pageCount}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="পরের পৃষ্ঠা"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/** Small count bubble used for navigation and tab badges. */
export function CountBubble({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn("ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground", className)}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
