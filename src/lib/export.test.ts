import { describe, expect, it } from "vitest";
import { csvCell, toCSV } from "./export";

describe("csvCell", () => {
  it("leaves plain values alone", () => {
    expect(csvCell("abc")).toBe("abc");
    expect(csvCell(12)).toBe("12");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(false)).toBe("false");
  });
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("toCSV", () => {
  it("writes a BOM, a header row and one line per row", () => {
    const csv = toCSV(
      [{ n: "রাহাত", b: 2015 }, { n: "A, B", b: null }],
      [{ header: "নাম", value: (r) => r.n }, { header: "ব্যাচ", value: (r) => r.b }],
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual(["নাম,ব্যাচ", "রাহাত,2015", '"A, B",']);
  });
});
