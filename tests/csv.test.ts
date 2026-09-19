import { describe, expect, it } from "vitest";
import { interpolate } from "../src/lib/i18n";
import { csvFilename, toCsv } from "../src/lib/csv";

describe("csv", () => {
  it("escapes quotes commas and newlines", () => {
    const csv = toCsv(
      [
        { name: 'A "lead"', note: "one, two", extra: "line1\nline2" },
        { name: "B", note: null, extra: 10 },
      ],
      [
        { key: "name", label: "Name" },
        { key: "note", label: "Note" },
        { key: "extra", label: "Extra" },
      ],
    );
    expect(csv.split("\r\n")[0]).toBe("Name,Note,Extra");
    expect(csv).toContain('"A ""lead"""');
    expect(csv).toContain('"one, two"');
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain("B,,10");
  });

  it("builds a stable filename", () => {
    expect(csvFilename("leads", new Date("2026-09-19T06:00:00.000Z"))).toBe("leads-2026-09-19-06-00-00.csv");
  });
});

describe("i18n interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("Для стадии заполните: {fields}", { fields: "Email" })).toBe("Для стадии заполните: Email");
    expect(interpolate("plain")).toBe("plain");
  });
});
