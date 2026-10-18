import { describe, expect, it } from "vitest";
import { explainAuthError, normalisePhone, registerSchema } from "./auth";

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

describe("normalisePhone", () => {
  it("strips spaces and dashes and converts digits", () => {
    expect(normalisePhone("+৮৮ ০১৭১২-৩৪৫৬৭৮")).toBe("+8801712345678");
  });
});
