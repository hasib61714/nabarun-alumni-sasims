import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z
  .object({
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").max(72, "পাসওয়ার্ড ৭২ অক্ষরের মধ্যে হতে হবে"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "পাসওয়ার্ড মিলছে না" });
type Values = z.infer<typeof schema>;

/** Form state and the Supabase call for changing the signed-in user's password. */
export function usePasswordChange(onDone?: () => void) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const [saving, setSaving] = useState(false);

  const submit = form.handleSubmit(async ({ password }) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
    form.reset();
    onDone?.();
  });
  return { form, submit, saving };
}
