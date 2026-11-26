// Minimal Server-Sent Events parsing for the live stream (read with fetch, not EventSource).

/**
 * Parses one SSE block ("event: x\ndata: {...}") into { event, payload }.
 * Returns null for comments, the "connected" greeting, empty data and invalid JSON.
 */
export function parseSseBlock(block) {
  let event = "message";
  const data = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
  }
  if (data.length === 0 || event === "connected") return null;
  try {
    return { event, payload: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

/**
 * Splits streamed text into blocks, however the chunks are cut, and calls onMessage
 * for each parsed event. Returns push(chunk).
 */
export function createSseParser(onMessage) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.replace(/\r\n/g, "\n");
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const message = parseSseBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (message) onMessage(message);
    }
  };
}
