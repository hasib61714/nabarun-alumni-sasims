import { describe, expect, it } from "vitest";
import { asciiDigits, positiveAmount, yearField } from "./forms";

describe("asciiDigits", () => {
  it("converts Bengali digits and leaves everything else alone", () => {
    expect(asciiDigits("২০১৭")).toBe("2017");
    expect(asciiDigits("৳১,২৫০.৫০")).toBe("৳1,250.50");
    expect(asciiDigits("abc 123")).toBe("abc 123");
  });
});

describe("yearField", () => {
  it("accepts ASCII and Bengali years and empty", () => {
    expect(yearField.parse("2017")).toBe("2017");
    expect(yearField.parse("২০১৭")).toBe("2017");
    expect(yearField.parse("")).toBe("");
    expect(yearField.parse(" 2017 ")).toBe("2017");
  });
  it("rejects anything else", () => {
    expect(yearField.safeParse("17").success).toBe(false);
    expect(yearField.safeParse("20177").success).toBe(false);
    expect(yearField.safeParse("year").success).toBe(false);
  });
});

describe("positiveAmount", () => {
  const required = positiveAmount("bad");
  const optional = positiveAmount("bad", true);
  it("parses Bengali and ASCII amounts", () => {
    expect(required.parse("৫০০")).toBe("500");
    expect(Number(required.parse("1250.5"))).toBe(1250.5);
  });
  it("rejects zero, negative, empty and text (required)", () => {
    for (const v of ["0", "-5", "", "abc"]) expect(required.safeParse(v).success).toBe(false);
  });
  it("allows empty only when optional", () => {
    expect(optional.safeParse("").success).toBe(true);
    expect(optional.safeParse("0").success).toBe(false);
  });
});
