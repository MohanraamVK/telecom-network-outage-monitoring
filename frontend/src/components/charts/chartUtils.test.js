import { describe, expect, it } from "vitest";
import { durationTicks, labelIndexes, niceTicks, shortDate, tickEvery } from "./chartUtils";

describe("niceTicks", () => {
  it("picks round steps", () => {
    expect(niceTicks(0, 10)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks(98.5, 100)).toEqual([98.5, 99, 99.5, 100]);
  });

  it("returns a single tick for a flat range", () => {
    expect(niceTicks(5, 5)).toEqual([5]);
  });
});

describe("durationTicks", () => {
  it("uses minute and hour steps that read naturally", () => {
    expect(durationTicks(50)).toEqual([0, 15, 30, 45, 60]);
    expect(durationTicks(170)).toEqual([0, 60, 120, 180]);
  });

  it("always reaches the maximum", () => {
    const ticks = durationTicks(1000);
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(1000);
  });
});

describe("x-axis labels", () => {
  it("spaces labels evenly", () => {
    expect(tickEvery(7)).toBe(1);
    expect(tickEvery(30)).toBe(5);
  });

  it("always labels the last day without crowding the one before it", () => {
    // 26 points: a label every 4th day, and day 24 would sit right next to day 25
    expect([...labelIndexes(26)]).toEqual([0, 4, 8, 12, 16, 20, 25]);
    // 30 points: day 25 is far enough from day 29 to keep
    expect([...labelIndexes(30)]).toEqual([0, 5, 10, 15, 20, 25, 29]);
  });

  it("handles empty and single-point series", () => {
    expect(labelIndexes(0).size).toBe(0);
    expect([...labelIndexes(1)]).toEqual([0]);
  });

  it("formats ISO dates without shifting the day", () => {
    expect(shortDate("2026-11-26")).toMatch(/26/);
  });
});
