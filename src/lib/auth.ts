import { z } from "zod";
import { asciiDigits, yearField } from "./forms";

export type AuthIssue = "invalid" | "unconfirmed" | "rate" | "network" | "exists" | "weak" | "disabled" | "other";

interface AuthErrorLike { message?: string; status?: number; code?: string }

/** Turns a Supabase auth error into something a visitor can act on. */
export function explainAuthError(error: AuthErrorLike): { issue: AuthIssue; message: string } {
  const code = error.code ?? "";
  const text = (error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || text.includes("email not confirmed")) {
    return { issue: "unconfirmed", message: "আপনার ইমেইল এখনো যাচাই হয়নি। ইমেইলে পাঠানো লিংকে ক্লিক করুন।" };
  }
  if (code === "invalid_credentials" || text.includes("invalid login credentials")) {
    return { issue: "invalid", message: "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার দেখে নিন, অথবা “পাসওয়ার্ড ভুলে গেছেন?” ব্যবহার করুন।" };
  }
  if (code === "user_already_exists" || text.includes("already registered") || text.includes("already been registered")) {
    return { issue: "exists", message: "এই ইমেইলে আগেই অ্যাকাউন্ট খোলা হয়েছে। লগইন করুন, অথবা পাসওয়ার্ড ভুলে গেলে রিসেট করুন।" };
  }
  if (code === "weak_password" || text.includes("password should be") || text.includes("weak password")) {
    return { issue: "weak", message: "পাসওয়ার্ডটি যথেষ্ট শক্ত নয়। অক্ষর ও সংখ্যা মিলিয়ে কমপক্ষে ৬ অক্ষর দিন।" };
  }
  if (code === "signup_disabled" || text.includes("signups not allowed")) {
    return { issue: "disabled", message: "এখন নতুন রেজিস্ট্রেশন বন্ধ আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।" };
  }
  if (error.status === 429 || code.includes("rate_limit") || text.includes("rate limit") || text.includes("too many")) {
    return { issue: "rate", message: "অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" };
  }
  if (error.status === 0 || text.includes("failed to fetch") || text.includes("network")) {
    return { issue: "network", message: "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।" };
  }
  return { issue: "other", message: error.message || "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।" };
}

/** Bangladeshi mobile number: 01XXXXXXXXX, with optional +88 / 88 in front. Bengali digits accepted. */
export const normalisePhone = (value: string): string => asciiDigits(value).replace(/[\s\-()]/g, "");
export const BD_MOBILE = /^(\+?88)?01[3-9]\d{8}$/;

export const RELATIONS = ["প্রাক্তন ছাত্র / ছাত্রী", "বর্তমান ছাত্র / ছাত্রী"] as const;
export const OTHER_INSTITUTION = "অন্যান্য";

const currentYear = new Date().getFullYear();

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "পূর্ণ নাম লিখুন").max(100, "নাম ১০০ অক্ষরের মধ্যে হতে হবে"),
    batchYear: yearField.refine((v) => v !== "", "ব্যাচ (SSC পাসের সাল) লিখুন").refine((v) => v === "" || (Number(v) >= 1980 && Number(v) <= currentYear + 1), `১৯৮০ থেকে ${currentYear + 1} এর মধ্যে সাল দিন`),
    roll: z.string().trim().max(30, "রোল ৩০ অক্ষরের মধ্যে হতে হবে").transform(asciiDigits),
    phone: z.string().transform(normalisePhone).refine((v) => BD_MOBILE.test(v), "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)"),
    institution: z.string().min(1, "কোন প্রতিষ্ঠানের ছাত্র তা বাছাই করুন"),
    relation: z.string().min(1, "আপনার পরিচয় বাছাই করুন"),
    note: z.string().trim().max(500, "৫০০ অক্ষরের মধ্যে লিখুন"),
    email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন").max(255),
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").max(72, "পাসওয়ার্ড ৭২ অক্ষরের মধ্যে হতে হবে"),
    confirm: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: "এগিয়ে যেতে নিশ্চিত করুন" }) }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "পাসওয়ার্ড মিলছে না" });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

/** The details an admin uses to recognise a registrant; a person may correct them while waiting. */
export const verificationSchema = z.object({
  phone: z.string().transform(normalisePhone).refine((v) => BD_MOBILE.test(v), "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)"),
  institution: z.string().min(1, "কোন প্রতিষ্ঠানের ছাত্র তা বাছাই করুন"),
  relation: z.string().min(1, "আপনার পরিচয় বাছাই করুন"),
  note: z.string().trim().max(500, "৫০০ অক্ষরের মধ্যে লিখুন"),
});
export type VerificationInput = z.input<typeof verificationSchema>;
export type VerificationValues = z.output<typeof verificationSchema>;
