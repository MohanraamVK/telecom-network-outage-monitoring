import { describe, expect, it } from "vitest";
import { formatDuration, formatRelative, minutesBetween } from "./time";

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [5.4, "5m"],
    [59, "59m"],
    [60, "1h"],
    [200, "3h 20m"],
    [1440, "1d"],
    [3120, "2d 4h"],
  ])("formats %s minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it("shows a dash when there is no value", () => {
    expect(formatDuration(null)).toBe("-");
    expect(formatDuration(undefined)).toBe("-");
    expect(formatDuration(Number.NaN)).toBe("-");
  });

  it("never shows negative durations", () => {
    expect(formatDuration(-15)).toBe("0m");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-11-26T12:00:00Z");

  it("describes recent and older times", () => {
    expect(formatRelative("2026-11-26T11:59:55Z", now)).toBe("just now");
    expect(formatRelative("2026-11-26T11:59:30Z", now)).toBe("30s ago");
    expect(formatRelative("2026-11-26T11:48:00Z", now)).toBe("12m ago");
    expect(formatRelative("2026-11-24T08:00:00Z", now)).toBe("2d 4h ago");
  });

  it("shows a dash for missing or invalid dates", () => {
    expect(formatRelative(null, now)).toBe("-");
    expect(formatRelative("not a date", now)).toBe("-");
  });
});

describe("minutesBetween", () => {
  it("returns the gap in minutes, or null when a side is missing", () => {
    expect(minutesBetween("2026-11-26T10:00:00Z", "2026-11-26T11:30:00Z")).toBe(90);
    expect(minutesBetween("2026-11-26T10:00:00Z", null)).toBeNull();
  });
});
