interface ReadSSEStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  onChunk: (data: unknown) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function readSSEStream({ reader, onChunk, onDone, signal }: ReadSSEStreamOptions): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  const finish = () => {
    if (!completed) {
      completed = true;
      onDone();
    }
  };
  const onAbort = () => { void reader.cancel(); };

  if (signal?.aborted) {throw createAbortError();}
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    while (!completed) {
      const { done, value } = await reader.read();
      if (signal?.aborted) {throw createAbortError();}
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (processEvent(event, onChunk)) {
          finish();
          await reader.cancel();
          return;
        }
      }

      if (done) {
        if (buffer && processEvent(buffer, onChunk)) {finish();}
        finish();
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

function processEvent(event: string, onChunk: (data: unknown) => void): boolean {
  const dataLines: string[] = [];
  for (const line of event.split("\n")) {
    if (!line || line.startsWith(":")) {continue;}
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) {value = value.slice(1);}
    if (field === "data") {dataLines.push(value);}
  }
  if (dataLines.length === 0) {return false;}
  const data = dataLines.join("\n");
  if (data.trim() === "[DONE]") {return true;}
  try {
    onChunk(JSON.parse(data));
  } catch (error) {
    const preview = data.replace(/[\r\n\t]+/g, " ").slice(0, 160);
    throw new Error(`Malformed SSE JSON (${preview.length} chars shown): ${preview}`, { cause: error });
  }
  return false;
}

function createAbortError(): Error {
  const error = new Error("Stream cancelled");
  error.name = "AbortError";
  return error;
}
