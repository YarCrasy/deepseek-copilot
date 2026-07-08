import { useCallback, useRef } from "react";
import type { ChatMessage } from "../ChatViewTypes";

/**
 * Encapsulates streamed assistant message state.
 */
export function useStreamHandler() {
  const streamingMessageIdRef = useRef<string | null>(null);
  const reasoningRef = useRef("");
  const messageCounterRef = useRef(0);

  const nextMessageId = useCallback(() => {
    messageCounterRef.current += 1;
    return `msg-${messageCounterRef.current}`;
  }, []);

  const resetStreaming = useCallback(() => {
    streamingMessageIdRef.current = null;
    reasoningRef.current = "";
  }, []);

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

  return {
    streamingMessageIdRef,
    reasoningRef,
    nextMessageId,
    ensureStreamingAssistantMessage,
    updateStreamingMessage,
    resetStreaming,
  };
}
