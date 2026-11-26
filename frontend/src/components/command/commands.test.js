import { describe, expect, it } from "vitest";
import { buildCommands, filterCommands, groupCommands, isTypingTarget, resolveShortcut } from "./commands";

const key = (k, extra = {}) => ({ key: k, target: document.body, ...extra });

describe("buildCommands", () => {
  it("offers write actions only to admins", () => {
    const viewer = buildCommands({ canEdit: false }).map((c) => c.id);
    const admin = buildCommands({ canEdit: true }).map((c) => c.id);
    expect(viewer).not.toContain("new-incident");
    expect(viewer).not.toContain("change-password");
    expect(viewer).toContain("logout");
    expect(admin).toEqual(expect.arrayContaining(["new-incident", "new-node", "change-password"]));
  });
});

describe("filterCommands", () => {
  const commands = buildCommands({ canEdit: true });

  it("returns everything for an empty query", () => {
    expect(filterCommands(commands, "  ")).toBe(commands);
  });

  it("matches keywords as well as labels", () => {
    expect(filterCommands(commands, "sla").map((c) => c.id)).toEqual(["go-analytics"]);
  });

  it("requires every word to match", () => {
    expect(filterCommands(commands, "add node").map((c) => c.id)).toEqual(["new-node"]);
    expect(filterCommands(commands, "add analytics")).toEqual([]);
  });

  it("ranks labels that start with the query first", () => {
    const ids = filterCommands(commands, "in").map((c) => c.id);
    expect(ids[0]).toBe("go-incidents");
  });
});

describe("groupCommands", () => {
  it("keeps groups in the order they first appear", () => {
    const groups = groupCommands([
      { id: 1, group: "Go to" },
      { id: 2, group: "Actions" },
      { id: 3, group: "Go to" },
    ]);
    expect(groups.map((g) => g.group)).toEqual(["Go to", "Actions"]);
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 3]);
  });
});

describe("resolveShortcut", () => {
  it("opens the palette with Ctrl+K or Cmd+K, even inside a text field", () => {
    const input = document.createElement("input");
    expect(resolveShortcut(key("k", { ctrlKey: true, target: input }), null).command).toEqual({ palette: true });
    expect(resolveShortcut(key("K", { metaKey: true }), null).command).toEqual({ palette: true });
  });

  it("follows g then a letter to a page", () => {
    const first = resolveShortcut(key("g"), null, { now: 1000 });
    expect(first.command).toBeNull();
    const second = resolveShortcut(key("i"), first.pending, { now: 1500 });
    expect(second.command).toEqual({ navigate: "/incidents" });
    expect(second.pending).toBeNull();
  });

  it("forgets a g pressed too long ago", () => {
    const first = resolveShortcut(key("g"), null, { now: 1000 });
    expect(resolveShortcut(key("i"), first.pending, { now: 5000 }).command).toBeNull();
  });

  it("only lets admins raise an incident with c", () => {
    expect(resolveShortcut(key("c"), null, { canEdit: true }).command).toEqual({ navigate: "/incidents?new=1" });
    expect(resolveShortcut(key("c"), null, { canEdit: false }).command).toBeNull();
  });

  it("opens the shortcut list with ?", () => {
    expect(resolveShortcut(key("?", { shiftKey: true }), null).command).toEqual({ action: "shortcuts" });
  });

  it("ignores letters typed into fields and keys with modifiers", () => {
    const textarea = document.createElement("textarea");
    expect(resolveShortcut(key("c", { target: textarea }), null, { canEdit: true }).command).toBeNull();
    expect(resolveShortcut(key("c", { altKey: true }), null, { canEdit: true }).command).toBeNull();
    expect(isTypingTarget(document.createElement("select"))).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
  });
});
