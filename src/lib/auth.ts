import { z } from "zod";
import { asciiDigits } from "./forms";
import type { Lang } from "./i18n";

export type AuthIssue = "invalid" | "unconfirmed" | "rate" | "network" | "exists" | "weak" | "disabled" | "other";

interface AuthErrorLike { message?: string; status?: number; code?: string }

const pick = (lang: Lang) => (bn: string, en: string) => (lang === "en" ? en : bn);

/** Turns a Supabase auth error into something a visitor can act on. */
export function explainAuthError(error: AuthErrorLike, lang: Lang = "bn"): { issue: AuthIssue; message: string } {
  const t = pick(lang);
  const code = error.code ?? "";
  const text = (error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || text.includes("email not confirmed")) {
    return { issue: "unconfirmed", message: t("আপনার ইমেইল এখনো যাচাই হয়নি। ইমেইলে পাঠানো লিংকে ক্লিক করুন।", "Your email is not verified yet. Click the link we sent to your inbox.") };
  }
  if (code === "invalid_credentials" || text.includes("invalid login credentials")) {
    return { issue: "invalid", message: t("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার দেখে নিন, অথবা “পাসওয়ার্ড ভুলে গেছেন?” ব্যবহার করুন।", "Incorrect email or password. Please check and try again, or use “Forgot password?”.") };
  }
  if (code === "user_already_exists" || text.includes("already registered") || text.includes("already been registered")) {
    return { issue: "exists", message: t("এই ইমেইলে আগেই অ্যাকাউন্ট খোলা হয়েছে। লগইন করুন, অথবা পাসওয়ার্ড ভুলে গেলে রিসেট করুন।", "An account already exists for this email. Log in, or reset your password if you have forgotten it.") };
  }
  if (code === "weak_password" || text.includes("password should be") || text.includes("weak password")) {
    return { issue: "weak", message: t("পাসওয়ার্ডটি যথেষ্ট শক্ত নয়। অক্ষর ও সংখ্যা মিলিয়ে কমপক্ষে ৬ অক্ষর দিন।", "That password is too weak. Use at least 6 characters, mixing letters and numbers.") };
  }
  if (code === "signup_disabled" || text.includes("signups not allowed")) {
    return { issue: "disabled", message: t("এখন নতুন রেজিস্ট্রেশন বন্ধ আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।", "New registrations are closed right now. Please contact the admin.") };
  }
  if (error.status === 429 || code.includes("rate_limit") || text.includes("rate limit") || text.includes("too many")) {
    return { issue: "rate", message: t("অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।", "Too many attempts in a short time. Please try again in a little while.") };
  }
  if (error.status === 0 || text.includes("failed to fetch") || text.includes("network")) {
    return { issue: "network", message: t("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।", "Can’t reach the server. Check your internet connection and try again.") };
  }
  return { issue: "other", message: error.message || t("কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।", "Something went wrong. Please try again.") };
}

/** Bangladeshi mobile number: 01XXXXXXXXX, with optional +88 / 88 in front. Bengali digits accepted. */
export const normalisePhone = (value: string): string => asciiDigits(value).replace(/[\s\-()]/g, "");
export const BD_MOBILE = /^(\+?88)?01[3-9]\d{8}$/;

export const RELATIONS = ["প্রাক্তন ছাত্র / ছাত্রী", "বর্তমান ছাত্র / ছাত্রী"] as const;
export const OTHER_INSTITUTION = "অন্যান্য";

const RELATION_EN: Record<string, string> = {
  "প্রাক্তন ছাত্র / ছাত্রী": "Alumnus / alumna",
  "বর্তমান ছাত্র / ছাত্রী": "Current student",
};

/** Display label for a stored relation value (the stored value itself stays Bengali). */
export const relationLabel = (value: string, lang: Lang): string => (lang === "en" ? RELATION_EN[value] ?? value : value);

/** Display label for the "other institution" choice; named institutions use their own `title`. */
export const institutionLabel = (value: string, lang: Lang): string => (lang === "en" && value === OTHER_INSTITUTION ? "Other" : value);

const currentYear = new Date().getFullYear();

const phoneField = (t: ReturnType<typeof pick>) =>
  z.string().transform(normalisePhone).refine((v) => BD_MOBILE.test(v), t("সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)", "Enter a valid mobile number (e.g. 01712345678)"));

export function buildRegisterSchema(lang: Lang = "bn") {
  const t = pick(lang);
  return z
    .object({
      fullName: z.string().trim().min(3, t("পূর্ণ নাম লিখুন", "Enter your full name")).max(100, t("নাম ১০০ অক্ষরের মধ্যে হতে হবে", "Name must be 100 characters or fewer")),
      batchYear: z.string().transform(asciiDigits).pipe(z.string().trim().regex(/^(\d{4})?$/, t("সঠিক সাল লিখুন (যেমন ২০১৭)", "Enter a valid year (e.g. 2017)")))
        .refine((v) => v !== "", t("ব্যাচ (SSC পাসের সাল) লিখুন", "Enter your batch (SSC pass year)"))
        .refine((v) => v === "" || (Number(v) >= 1980 && Number(v) <= currentYear + 1), t(`১৯৮০ থেকে ${currentYear + 1} এর মধ্যে সাল দিন`, `Enter a year between 1980 and ${currentYear + 1}`)),
      roll: z.string().trim().max(30, t("রোল ৩০ অক্ষরের মধ্যে হতে হবে", "Roll must be 30 characters or fewer")).transform(asciiDigits),
      phone: phoneField(t),
      institution: z.string().min(1, t("কোন প্রতিষ্ঠানের ছাত্র তা বাছাই করুন", "Select your institution")),
      relation: z.string().min(1, t("আপনার পরিচয় বাছাই করুন", "Select who you are")),
      note: z.string().trim().max(500, t("৫০০ অক্ষরের মধ্যে লিখুন", "Keep it within 500 characters")),
      email: z.string().trim().toLowerCase().email(t("সঠিক ইমেইল দিন", "Enter a valid email")).max(255),
      password: z.string().min(6, t("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "Password must be at least 6 characters")).max(72, t("পাসওয়ার্ড ৭২ অক্ষরের মধ্যে হতে হবে", "Password must be 72 characters or fewer")),
      confirm: z.string(),
      agree: z.literal(true, { errorMap: () => ({ message: t("এগিয়ে যেতে নিশ্চিত করুন", "Please confirm to continue") }) }),
    })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: t("পাসওয়ার্ড মিলছে না", "Passwords do not match") });
}

export const registerSchema = buildRegisterSchema("bn");
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

/** The details an admin uses to recognise a registrant; a person may correct them while waiting. */
export function buildVerificationSchema(lang: Lang = "bn") {
  const t = pick(lang);
  return z.object({
    phone: phoneField(t),
    institution: z.string().min(1, t("কোন প্রতিষ্ঠানের ছাত্র তা বাছাই করুন", "Select your institution")),
    relation: z.string().min(1, t("আপনার পরিচয় বাছাই করুন", "Select who you are")),
    note: z.string().trim().max(500, t("৫০০ অক্ষরের মধ্যে লিখুন", "Keep it within 500 characters")),
  });
}

export const verificationSchema = buildVerificationSchema("bn");
export type VerificationInput = z.input<typeof verificationSchema>;
export type VerificationValues = z.output<typeof verificationSchema>;
