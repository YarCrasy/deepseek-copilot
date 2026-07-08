interface ReadSSEStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  onChunk: (data: unknown) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function readSSEStream(options: ReadSSEStreamOptions): Promise<void> {
  const { reader, onChunk, onDone, signal } = options;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onDone();
      break;
    }
    if (signal?.aborted) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) {
        continue;
      }

      const data = trimmed.slice(6).trim();
      if (data === "[DONE]") {
        onDone();
        return;
      }

      try {
        onChunk(JSON.parse(data));
      } catch {
        // Ignore malformed SSE chunks.
      }
    }
  }
}
