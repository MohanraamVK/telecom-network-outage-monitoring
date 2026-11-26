import { describe, expect, it, vi } from "vitest";
import { createSseParser, parseSseBlock } from "./sse";

describe("parseSseBlock", () => {
  it("reads the event name and JSON data", () => {
    expect(parseSseBlock('event: node.changed\ndata: {"id":3}')).toEqual({ event: "node.changed", payload: { id: 3 } });
  });

  it("joins multi-line data", () => {
    expect(parseSseBlock('event: x\ndata: {"a":\ndata: 1}')).toEqual({ event: "x", payload: { a: 1 } });
  });

  it("skips greetings, comments and broken JSON", () => {
    expect(parseSseBlock('event: connected\ndata: {"ok":true}')).toBeNull();
    expect(parseSseBlock(": keep-alive")).toBeNull();
    expect(parseSseBlock("event: x\ndata: {nope")).toBeNull();
  });
});

describe("createSseParser", () => {
  it("handles events split across chunks and CRLF line endings", () => {
    const onMessage = vi.fn();
    const push = createSseParser(onMessage);
    push('event: incident.changed\r\ndata: {"id"');
    expect(onMessage).not.toHaveBeenCalled();
    push(':1}\r\n\r\nevent: node.changed\ndata: {"id":2}\n\n: ping\n\n');
    expect(onMessage.mock.calls.map(([m]) => m)).toEqual([
      { event: "incident.changed", payload: { id: 1 } },
      { event: "node.changed", payload: { id: 2 } },
    ]);
  });
});
