import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../ChatViewTypes";

const TYPEWRITER_INTERVAL_MS = 12;
const TYPEWRITER_CHARS_PER_TICK = 2;
type StreamTextKind = "content" | "reasoning";

/**
 * Encapsulates streamed assistant message state.
 */
export function useStreamHandler() {
  const streamingMessageIdRef = useRef<string | null>(null);
  const reasoningRef = useRef("");
  const messageCounterRef = useRef(0);
  const contentQueueRef = useRef<string[]>([]);
  const reasoningQueueRef = useRef<string[]>([]);
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reasoningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextMessageId = useCallback(() => {
    messageCounterRef.current += 1;
    return `msg-${messageCounterRef.current}`;
  }, []);

  const clearQueue = useCallback((kind: StreamTextKind) => {
    const timerRef = kind === "content" ? contentTimerRef : reasoningTimerRef;
    const queueRef = kind === "content" ? contentQueueRef : reasoningQueueRef;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    queueRef.current = [];
  }, []);

  const resetStreaming = useCallback(() => {
    clearQueue("content");
    clearQueue("reasoning");
    streamingMessageIdRef.current = null;
    reasoningRef.current = "";
  }, [clearQueue]);

  /**
   * Ensures that an assistant message exists for the active stream.
   */
  const ensureStreamingAssistantMessage = useCallback(
    (setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>): string => {
      if (streamingMessageIdRef.current) {
        return streamingMessageIdRef.current;
      }

      const id = nextMessageId();
      streamingMessageIdRef.current = id;

      setMessages((current) => [
        ...current,
        {
          id,
          role: "assistant",
          content: "",
          reasoning: reasoningRef.current || undefined,
        },
      ]);

      return id;
    },
    [nextMessageId],
  );

  /**
   * Updates the active streaming message, creating it first when needed.
   */
  const updateStreamingMessage = useCallback(
    (updater: (message: ChatMessage) => ChatMessage, setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
      const id = ensureStreamingAssistantMessage(setMessages);
      setMessages((current) => current.map((message) => (message.id === id ? updater(message) : message)));
    },
    [ensureStreamingAssistantMessage],
  );

  const drainQueue = useCallback((kind: StreamTextKind, setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, messageId: string) => {
    const queueRef = kind === "content" ? contentQueueRef : reasoningQueueRef;
    const timerRef = kind === "content" ? contentTimerRef : reasoningTimerRef;
    const text = queueRef.current.splice(0, TYPEWRITER_CHARS_PER_TICK).join("");

    if (text) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                [kind]: `${message[kind] ?? ""}${text}`,
              }
            : message,
        ),
      );
    }

    if (queueRef.current.length > 0) {
      timerRef.current = setTimeout(() => drainQueue(kind, setMessages, messageId), TYPEWRITER_INTERVAL_MS);
    } else {
      timerRef.current = null;
    }
  }, []);

  const enqueueStreamingText = useCallback(
    (kind: StreamTextKind, content: string, setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
      if (!content) {
        return;
      }

      const messageId = ensureStreamingAssistantMessage(setMessages);
      const queueRef = kind === "content" ? contentQueueRef : reasoningQueueRef;
      const timerRef = kind === "content" ? contentTimerRef : reasoningTimerRef;

      queueRef.current.push(...Array.from(content));
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => drainQueue(kind, setMessages, messageId), TYPEWRITER_INTERVAL_MS);
      }
    },
    [drainQueue, ensureStreamingAssistantMessage],
  );

  useEffect(() => resetStreaming, [resetStreaming]);

  return {
    streamingMessageIdRef,
    reasoningRef,
    nextMessageId,
    ensureStreamingAssistantMessage,
    enqueueStreamingText,
    updateStreamingMessage,
    resetStreaming,
  };
}
