import { describe, expect, it } from "vitest";
import { canTransition, isFinalStatus } from "./incidentWorkflow";

describe("incident workflow", () => {
  it("allows moving between open, in progress and resolved", () => {
    expect(canTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("RESOLVED", "OPEN")).toBe(true);
    expect(canTransition("IN_PROGRESS", "CLOSED")).toBe(true);
  });

  it("treats closed as final", () => {
    expect(canTransition("CLOSED", "OPEN")).toBe(false);
    expect(isFinalStatus("CLOSED")).toBe(true);
    expect(isFinalStatus("RESOLVED")).toBe(false);
  });

  it("accepts staying on the same status", () => {
    expect(canTransition("CLOSED", "CLOSED")).toBe(true);
  });
});
