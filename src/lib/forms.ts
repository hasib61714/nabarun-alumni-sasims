import { z } from "zod";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Turns Bengali digits (০-৯) into ASCII ones so numbers typed on a Bangla keyboard are understood. */
export const asciiDigits = (value: string): string => value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** A four digit year, or empty. Accepts Bengali digits. */
export const yearField = z.string().transform(asciiDigits).pipe(z.string().trim().regex(/^(\d{4})?$/, "সঠিক সাল লিখুন (যেমন ২০১৭)"));

/** A positive number typed as text (Bengali digits allowed); empty is allowed only when `optional`. */
export const positiveAmount = (message: string, optional = false) =>
  z.string().transform((v) => asciiDigits(v).trim()).refine((v) => (optional && v === "") || (v !== "" && Number(v) > 0), message);
