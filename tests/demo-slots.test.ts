import { describe, expect, it } from "vitest";
import { generateOpenSlots, nextAutoSlot, overlaps, slotFromAlmaty } from "../src/lib/demo-slots";

describe("demo slots", () => {
  it("skips Sunday and starts Monday 10:00 Almaty", () => {
    const now = new Date("2026-09-20T08:00:00.000Z");
    const first = nextAutoSlot({ now, busy: [] });
    expect(first?.toISOString()).toBe(slotFromAlmaty(2026, 8, 21, 10, 0).toISOString());
  });

  it("does not offer a slot that overlaps a booked demo", () => {
    const now = new Date("2026-09-21T03:00:00.000Z");
    const taken = slotFromAlmaty(2026, 8, 21, 10, 0);
    const slots = generateOpenSlots({
      from: now,
      days: 1,
      now,
      busy: [{ start: taken, end: new Date(taken.getTime() + 30 * 60 * 1000) }],
    });
    expect(slots[0]?.toISOString()).toBe(slotFromAlmaty(2026, 8, 21, 10, 30).toISOString());
    expect(overlaps({ start: taken, end: new Date(taken.getTime() + 30 * 60000) }, { start: taken, end: new Date(taken.getTime() + 15 * 60000) })).toBe(true);
  });
});
