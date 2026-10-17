import { describe, expect, it } from "vitest";
import { computeCompleteness, emptyProfileForm, profileSchema, toProfileForm, toProfileRow } from "./profile";

describe("computeCompleteness", () => {
  it("is 0% for an empty or missing profile and lists everything as missing", () => {
    expect(computeCompleteness(null).percent).toBe(0);
    expect(computeCompleteness({}).missing).toHaveLength(8);
  });
  it("counts blank and whitespace-only values as missing", () => {
    const c = computeCompleteness({ full_name: "  ", roll: "", batch_year: null });
    expect(c.percent).toBe(0);
  });
  it("is 100% when everything is filled and one social link is enough", () => {
    const c = computeCompleteness({
      full_name: "রাহাত", roll: "101", batch_year: 2017, photo: "https://x/y.png", result: "GPA 5", current_profession: "Engineer",
      location: "ঢাকা", linkedin_link: "https://linkedin.com/in/x", facebook_link: null,
    });
    expect(c.percent).toBe(100);
    expect(c.missing).toEqual([]);
  });
  it("reports what is missing", () => {
    const c = computeCompleteness({ full_name: "রাহাত", roll: "1", batch_year: 2017, photo: null, result: "x", current_profession: "x", location: "x", facebook_link: "https://fb.com/x" });
    expect(c.percent).toBe(88);
    expect(c.missing.map((m) => m.key)).toEqual(["photo"]);
  });
});

describe("profile form", () => {
  it("round-trips a profile through the form values", () => {
    const form = toProfileForm({ full_name: "রাহাত", batch_year: 2017, roll: null, linkedin_link: "https://l.in/x" });
    expect(form).toMatchObject({ full_name: "রাহাত", batch_year: "2017", roll: "", linkedin_link: "https://l.in/x" });
    const row = toProfileRow(profileSchema.parse(form));
    expect(row).toMatchObject({ full_name: "রাহাত", batch_year: 2017, roll: null, linkedin_link: "https://l.in/x", facebook_link: null });
  });
  it("accepts Bengali digits for the batch and rejects bad input", () => {
    expect(profileSchema.parse({ ...emptyProfileForm, full_name: "ক", batch_year: "২০১৭" }).batch_year).toBe("2017");
    expect(profileSchema.safeParse({ ...emptyProfileForm }).success).toBe(false); // name required
    expect(profileSchema.safeParse({ ...emptyProfileForm, full_name: "ক", linkedin_link: "javascript:alert(1)" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...emptyProfileForm, full_name: "ক", batch_year: "17" }).success).toBe(false);
  });
});
