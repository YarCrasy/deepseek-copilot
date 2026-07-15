import { useCallback, useEffect, useRef } from "react";
import type { AssistantTimelineEvent } from "@/adapters";
import type { ChatMessage } from "../ChatViewTypes";

type TimelineTextEvent = Extract<AssistantTimelineEvent, { type: "reasoning" | "content" }>;
type TimelineToolGroupEvent = Extract<AssistantTimelineEvent, { type: "tool-group" }>;

/** Maintains the single assistant message receiving the current event stream. */
export function useStreamHandler() {
  const streamingMessageIdRef = useRef<string | null>(null);

  const nextMessageId = useCallback(() => crypto.randomUUID(), []);

  const resetStreaming = useCallback(() => {
    streamingMessageIdRef.current = null;
  }, []);

  const ensureStreamingAssistantMessage = useCallback(
    (setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>): string => {
      if (streamingMessageIdRef.current) {
        return streamingMessageIdRef.current;
      }

      const id = nextMessageId();
      streamingMessageIdRef.current = id;
      setMessages((current) => [...current, { id, role: "assistant", content: "", timeline: [] }]);
      return id;
    },
    [nextMessageId],
  );

  const appendTimelineDelta = useCallback(
    (
      eventId: string,
      eventType: TimelineTextEvent["type"],
      content: string,
      setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
    ) => {
      if (!content) {
        return;
      }
      const messageId = ensureStreamingAssistantMessage(setMessages);

      setMessages((current) =>
        current.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const timeline = [...(message.timeline ?? [])];
          const existingIndex = timeline.findIndex((event) => event.id === eventId);
          if (existingIndex >= 0) {
            const existing = timeline[existingIndex];
            if (existing.type !== eventType) {
              return message;
            }
            timeline[existingIndex] = { ...existing, content: existing.content + content };
          } else {
            timeline.push({ id: eventId, type: eventType, content });
          }

          return {
            ...message,
            content: eventType === "content" ? message.content + content : message.content,
            timeline,
          };
        }),
      );
    },
    [ensureStreamingAssistantMessage],
  );

  const appendTimelineToolGroup = useCallback(
    (event: TimelineToolGroupEvent, setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
      const messageId = ensureStreamingAssistantMessage(setMessages);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId && !(message.timeline ?? []).some((item) => item.id === event.id)
            ? { ...message, timeline: [...(message.timeline ?? []), event] }
            : message,
        ),
      );
    },
    [ensureStreamingAssistantMessage],
  );

  useEffect(() => resetStreaming, [resetStreaming]);

  return {
    streamingMessageIdRef,
    nextMessageId,
    appendTimelineDelta,
    appendTimelineToolGroup,
    resetStreaming,
  };
}
