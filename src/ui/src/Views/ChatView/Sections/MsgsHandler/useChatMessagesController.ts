import { useCallback, useRef, useState } from "react";
import type { AppConfig } from "@/adapters";
import type { ChatMessage, InitialConfig, StoredToolCall } from "../../ChatViewTypes";
import { useStreamHandler, type MessageDispatcher } from "../../hooks";

interface ChatMessagesControllerOptions {
  externalMessages?: ChatMessage[];
  externalSetMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  externalIsProcessing?: boolean;
  externalListRef?: React.RefObject<HTMLDivElement | null>;
  onApiKeyStatusChange?: (status: "configured" | "missing") => void;
  onConfigLoaded?: (config: InitialConfig) => void;
  onModelChanged?: (modelId: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  onGenerationCancelled?: () => void;
  focusInput: () => void;
}

export function useChatMessagesController({
  externalMessages,
  externalSetMessages,
  externalIsProcessing,
  externalListRef,
  onApiKeyStatusChange,
  onConfigLoaded,
  onModelChanged,
  onProcessingChange,
  onGenerationCancelled,
  focusInput,
}: ChatMessagesControllerOptions) {
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);
  const internalListRef = useRef<HTMLDivElement | null>(null);
  const { nextMessageId, reasoningRef, streamingMessageIdRef, updateStreamingMessage, resetStreaming } = useStreamHandler();

  const messages = externalMessages ?? internalMessages;
  const setMessages = externalSetMessages ?? setInternalMessages;
  const isProcessing = externalIsProcessing ?? internalIsProcessing;
  const listRef = externalListRef ?? internalListRef;

  const setProcessing = useCallback(
    (value: boolean) => {
      setInternalIsProcessing(value);
      onProcessingChange?.(value);
    },
    [onProcessingChange],
  );

  const dispatcher: MessageDispatcher = {
    onAddMessage: useCallback(
      (message) => {
        const { wasStreamed, ...rest } = message;
        setMessages((current) => {
          if (wasStreamed && rest.role === "assistant") {
            return updateStreamedAssistant(current, streamingMessageIdRef.current, rest.toolCalls);
          }

          return [
            ...current,
            {
              id: nextMessageId(),
              role: rest.role as ChatMessage["role"],
              content: rest.content,
              toolCalls: rest.toolCalls as StoredToolCall[] | undefined,
            },
          ];
        });
      },
      [nextMessageId, setMessages, streamingMessageIdRef],
    ),

    onShowTyping: useCallback(() => {
      setProcessing(true);
      resetStreaming();
    }, [setProcessing, resetStreaming]),

    onStreamChunk: useCallback(
      (content: string) => {
        updateStreamingMessage((message) => ({ ...message, content: `${message.content}${content}` }), setMessages);
      },
      [setMessages, updateStreamingMessage],
    ),

    onStreamReasoning: useCallback(
      (content: string) => {
        reasoningRef.current = `${reasoningRef.current}${content}`;
        updateStreamingMessage((message) => ({ ...message, reasoning: `${message.reasoning ?? ""}${content}` }), setMessages);
      },
      [reasoningRef, setMessages, updateStreamingMessage],
    ),

    onStreamDone: useCallback(
      (info) => {
        setProcessing(false);
        resetStreaming();

        if (info.cancelled) {
          setMessages(removeCancelledTurn);
          onGenerationCancelled?.();
          focusInput();
          return;
        }

        if (info.finish_reason === "insufficient_system_resource") {
          console.warn("[ChatView] Stream ended because of insufficient system resources");
        }

        focusInput();
      },
      [focusInput, setMessages, setProcessing, resetStreaming, onGenerationCancelled],
    ),

    onStreamError: useCallback(
      (error: string) => {
        setProcessing(false);
        resetStreaming();
        setMessages((current) => [...current, { id: nextMessageId(), role: "error", content: error }]);
        focusInput();
      },
      [focusInput, setProcessing, resetStreaming, nextMessageId, setMessages],
    ),

    onClearChat: useCallback(() => {
      setMessages([]);
      setProcessing(false);
      resetStreaming();
    }, [setMessages, setProcessing, resetStreaming]),

    onModelChanged: useCallback((modelId: string) => onModelChanged?.(modelId), [onModelChanged]),
    onApiKeyStatus: useCallback((status) => onApiKeyStatusChange?.(status), [onApiKeyStatusChange]),
    onConfigLoaded: useCallback(
      (config: Partial<AppConfig>) => {
        onConfigLoaded?.({
          reasoning: config.thinkingMode === false ? "off" : config.reasoningEffort === "max" ? "max" : "high",
          model: config.model ?? undefined,
        });
      },
      [onConfigLoaded],
    ),
  };

  return { messages, isProcessing, listRef, dispatcher };
}

function removeCancelledTurn(current: ChatMessage[]): ChatMessage[] {
  const next = [...current];

  while (next.length > 0 && next[next.length - 1].role === "assistant" && !next[next.length - 1].content.trim()) {
    next.pop();
  }

  if (next.length > 0 && next[next.length - 1].role === "assistant") {
    next.pop();
  }

  if (next.length > 0 && next[next.length - 1].role === "user") {
    next.pop();
  }

  return next;
}

function updateStreamedAssistant(current: ChatMessage[], streamingId: string | null, toolCalls: StoredToolCall[] | undefined): ChatMessage[] {
  const patch = (message: ChatMessage): ChatMessage => ({
    ...message,
    toolCalls: toolCalls as StoredToolCall[] | undefined,
  });

  if (streamingId) {
    const index = current.findIndex((message) => message.id === streamingId);
    if (index >= 0) {
      return current.map((message, messageIndex) => (messageIndex === index ? patch(message) : message));
    }
  }

  return current.map((message, index) => (index === current.length - 1 && message.role === "assistant" ? patch(message) : message));
}
