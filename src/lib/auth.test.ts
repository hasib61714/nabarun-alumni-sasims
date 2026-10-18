import { describe, expect, it } from "vitest";
import { buildRegisterSchema, buildVerificationSchema, explainAuthError, institutionLabel, normalisePhone, registerSchema, relationLabel } from "./auth";

describe("explainAuthError", () => {
  it("tells apart a wrong password and an unconfirmed e-mail", () => {
    expect(explainAuthError({ message: "Invalid login credentials", code: "invalid_credentials" }).issue).toBe("invalid");
    expect(explainAuthError({ message: "Email not confirmed", code: "email_not_confirmed" }).issue).toBe("unconfirmed");
  });
  it("recognises rate limits, duplicates, weak passwords and network failures", () => {
    expect(explainAuthError({ message: "email rate limit exceeded", status: 429 }).issue).toBe("rate");
    expect(explainAuthError({ message: "User already registered" }).issue).toBe("exists");
    expect(explainAuthError({ message: "Password should be at least 6 characters" }).issue).toBe("weak");
    expect(explainAuthError({ message: "Failed to fetch", status: 0 }).issue).toBe("network");
  });
  it("passes through anything else", () => {
    expect(explainAuthError({ message: "Boom" })).toEqual({ issue: "other", message: "Boom" });
    expect(explainAuthError({ message: "Boom" }, "en")).toEqual({ issue: "other", message: "Boom" });
  });
  it("answers in the requested language, Bengali by default", () => {
    const err = { message: "Invalid login credentials", code: "invalid_credentials" };
    expect(explainAuthError(err).message).toMatch(/ভুল/);
    expect(explainAuthError(err, "bn").message).toBe(explainAuthError(err).message);
    expect(explainAuthError(err, "en")).toEqual({ issue: "invalid", message: expect.stringContaining("Incorrect email or password") });
    expect(explainAuthError({ code: "user_already_exists" }, "en").message).toMatch(/already exists/);
    expect(explainAuthError({}, "en").message).toBe("Something went wrong. Please try again.");
  });
});

describe("registerSchema", () => {
  const valid = {
    fullName: "মোঃ রহিম উদ্দিন", batchYear: "২০১৫", roll: "১২", phone: "০১৭১২-৩৪৫৬৭৮", institution: "নবারুণ পাবলিক স্কুল",
    relation: "প্রাক্তন ছাত্র / ছাত্রী", note: "", email: " Rahim@Example.com ", password: "secret1", confirm: "secret1", agree: true as const,
  };
  it("accepts Bengali digits and tidies values", () => {
    const out = registerSchema.parse(valid);
    expect(out.batchYear).toBe("2015");
    expect(out.roll).toBe("12");
    expect(out.phone).toBe("01712345678");
    expect(out.email).toBe("rahim@example.com");
  });
  it("rejects a bad phone, mismatched passwords and a missing confirmation", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, confirm: "other" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, agree: false }).success).toBe(false);
  });
  it("requires a batch year in range", () => {
    expect(registerSchema.safeParse({ ...valid, batchYear: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, batchYear: "1950" }).success).toBe(false);
  });
});

describe("buildRegisterSchema", () => {
  const bad = {
    fullName: "", batchYear: "1950", roll: "", phone: "12345", institution: "", relation: "", note: "",
    email: "nope", password: "123", confirm: "456", agree: false,
  };
  const messages = (lang: "bn" | "en") => {
    const r = buildRegisterSchema(lang).safeParse(bad);
    return r.success ? [] : r.error.issues.map((i) => i.message);
  };
  it("keeps Bengali messages by default", () => {
    expect(messages("bn")).toContain("পূর্ণ নাম লিখুন");
    expect(registerSchema.safeParse(bad).success).toBe(false);
  });
  it("returns English messages for the English site", () => {
    const en = messages("en");
    expect(en).toContain("Enter your full name");
    expect(en).toContain("Enter a valid email");
    expect(en).toContain("Password must be at least 6 characters");
    expect(en).toContain("Select your institution");
    expect(en.some((m) => /[\u0980-\u09FF]/.test(m))).toBe(false);
  });
  it("checks that passwords match in English too", () => {
    const r = buildRegisterSchema("en").safeParse({ ...bad, fullName: "Rahim Uddin", batchYear: "2015", phone: "01712345678", institution: "x", relation: "y", email: "a@b.co", password: "secret1", confirm: "other", agree: true });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.message)).toEqual(["Passwords do not match"]);
  });
});

describe("buildVerificationSchema", () => {
  it("localises the messages", () => {
    const r = buildVerificationSchema("en").safeParse({ phone: "1", institution: "", relation: "", note: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.message)).toContain("Enter a valid mobile number (e.g. 01712345678)");
  });
});

describe("display labels", () => {
  it("translates stored Bengali values for display only", () => {
    expect(relationLabel("প্রাক্তন ছাত্র / ছাত্রী", "en")).toBe("Alumnus / alumna");
    expect(relationLabel("প্রাক্তন ছাত্র / ছাত্রী", "bn")).toBe("প্রাক্তন ছাত্র / ছাত্রী");
    expect(institutionLabel("অন্যান্য", "en")).toBe("Other");
    expect(institutionLabel("অন্যান্য", "bn")).toBe("অন্যান্য");
  });
});

describe("normalisePhone", () => {
  it("strips spaces and dashes and converts digits", () => {
    expect(normalisePhone("+৮৮ ০১৭১২-৩৪৫৬৭৮")).toBe("+8801712345678");
  });
});
