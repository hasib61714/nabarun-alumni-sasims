import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { usePasswordChange } from "@/hooks/usePasswordChange";
import { Field } from "./FormDialog";

/** The two password inputs, with a show/hide switch. */
export function PasswordFields({ form }: { form: ReturnType<typeof usePasswordChange>["form"] }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const { errors } = form.formState;
  return (
    <>
      <Field label="নতুন পাসওয়ার্ড" htmlFor={`${id}-new`} required error={errors.password?.message} hint="কমপক্ষে ৬ অক্ষর; অক্ষর ও সংখ্যা মিলিয়ে দিলে ভালো।">
        <div className="relative">
          <Input id={`${id}-new`} type={visible ? "text" : "password"} autoComplete="new-password" className="pr-10" {...form.register("password")} />
          <button
            type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Field label="পাসওয়ার্ড নিশ্চিত করুন" htmlFor={`${id}-confirm`} required error={errors.confirm?.message}>
        <Input id={`${id}-confirm`} type={visible ? "text" : "password"} autoComplete="new-password" {...form.register("confirm")} />
      </Field>
    </>
  );
}
