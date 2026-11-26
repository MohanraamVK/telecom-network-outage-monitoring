import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "./passwordRules";

describe("validatePasswordChange", () => {
  it("accepts a valid change", () => {
    expect(validatePasswordChange({ current: "old-pass", next: "a-new-passphrase", confirm: "a-new-passphrase" })).toEqual({});
  });

  it("requires the current password", () => {
    expect(validatePasswordChange({ current: "", next: "a-new-passphrase", confirm: "a-new-passphrase" })).toHaveProperty("current");
  });

  it("enforces the length the API accepts", () => {
    expect(validatePasswordChange({ current: "x", next: "short", confirm: "short" }).next).toMatch(/at least 10/);
    const long = "x".repeat(101);
    expect(validatePasswordChange({ current: "x", next: long, confirm: long }).next).toMatch(/100/);
  });

  it("rejects reusing the current password and mismatched repeats", () => {
    expect(validatePasswordChange({ current: "same-password", next: "same-password", confirm: "same-password" }).next).toMatch(/different/);
    expect(validatePasswordChange({ current: "x", next: "a-new-passphrase", confirm: "a-new-passphrasE" }).confirm).toMatch(/match/);
  });
});
