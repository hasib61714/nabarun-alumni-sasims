import { FormDialog } from "./FormDialog";
import { usePasswordChange } from "@/hooks/usePasswordChange";
import { PasswordFields } from "./PasswordChange";

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { form, submit, saving } = usePasswordChange(() => onOpenChange(false));
  return (
    <FormDialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o); }} title="পাসওয়ার্ড পরিবর্তন" onSubmit={() => submit()} loading={saving} submitLabel="পরিবর্তন করুন">
      <PasswordFields form={form} />
    </FormDialog>
  );
}
