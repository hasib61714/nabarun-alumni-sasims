import { cloneElement, isValidElement, useId, type FormEvent, type ReactElement, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint/error, used by every form in the app.
 * A single <Input> or <Textarea> child is wired to the label (and to the error/hint text) automatically.
 */
export function Field({ label, htmlFor, required, error, hint, className, children }: FieldProps) {
  const autoId = useId();
  const messageId = `${autoId}-message`;
  const message = error ?? hint;

  let control = children;
  let controlId = htmlFor;
  if (isValidElement(children) && (children.type === Input || children.type === Textarea || children.type === "input" || children.type === "textarea")) {
    const element = children as ReactElement<{ id?: string }>;
    controlId = element.props.id ?? htmlFor ?? autoId;
    control = cloneElement(element as ReactElement<Record<string, unknown>>, {
      id: controlId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": message ? messageId : undefined,
    });
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={controlId}>
        {label}
        {required && <span className="ml-0.5 text-accent" aria-hidden>*</span>}
      </Label>
      {control}
      {error ? <p id={messageId} role="alert" className="text-xs text-destructive">{error}</p> : hint ? <p id={messageId} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  /** Wider layout for forms with many fields. */
  wide?: boolean;
  children: ReactNode;
}

/** Dialog with a form, a sticky footer and a busy state. Scrolls on small screens. */
export function FormDialog({ open, onOpenChange, title, description, onSubmit, submitLabel = "সংরক্ষণ করুন", loading, wide, children }: FormDialogProps) {
  const handle = (e: FormEvent) => {
    e.preventDefault();
    if (!loading) void onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!loading) onOpenChange(next); }}>
      <DialogContent className={cn("flex max-h-[92dvh] flex-col gap-0 p-0 sm:rounded-xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handle} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
          <div className="flex gap-2 border-t bg-card px-5 py-3 sm:justify-end">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)} disabled={loading}>বাতিল</Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
