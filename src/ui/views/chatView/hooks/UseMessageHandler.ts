import { useEffect } from "react";
import type { VsCodeApi } from "@webview/VsCodeApi";
import type { AssistantTimelineEvent, HandlerToWebviewMessage, AppConfig, StoredToolCall, ToolCall } from "@/adapters";
import type { ApiKeyStatus, DangerConfirmationData, ToolCallStatus } from "../ChatViewTypes";
import { setInterfaceLanguage } from "@webview/i18n";

/**
 * Additional streamDone event data.
 */
export type StreamDoneInfo = {
  cancelled?: boolean;
  finish_reason?: string;
};

/**
 * Dispatcher with optional handlers for each webview message type.
 */
export type MessageDispatcher = {
  onAddMessage?: (message: {
    role: string;
    content: string;
    wasStreamed?: boolean;
    toolCalls?: StoredToolCall[];
    timeline?: AssistantTimelineEvent[];
    toolCallId?: string;
    toolName?: string;
  }) => void;
  onShowTyping?: () => void;
  onStreamTimelineDelta?: (data: { eventId: string; eventType: "reasoning" | "content"; content: string }) => void;
  onStreamTimelineToolGroup?: (event: Extract<AssistantTimelineEvent, { type: "tool-group" }>) => void;
  onStreamDone?: (info: StreamDoneInfo) => void;
  onStreamError?: (error: string) => void;
  onClearChat?: () => void;
  onModelChanged?: (modelId: string) => void;
  onApiKeyStatus?: (status: ApiKeyStatus) => void;
  onConfigLoaded?: (config: Partial<AppConfig>) => void;
  onToolCallStarted?: (data: { toolCalls: ToolCall[]; round: number }) => void;
  onToolCallResult?: (data: { toolCallId: string; toolName: string; result: string; isError?: boolean; rejected?: boolean; status: ToolCallStatus }) => void;
  onToolCallActionAccepted?: (data: { toolCallId: string; status: "running" | "rejected" }) => void;
  onToolCallConfirmationRequired?: (data: { toolCalls: ToolCall[]; round: number; autoExecute: boolean; dangerConfirmation?: DangerConfirmationData }) => void;
  onToolCallLimitReached?: (data: { completedRounds: number; batchSize: number }) => void;
};

/**
 * Registers the webview message listener and routes messages to the dispatcher.
 */
export function useMessageHandler(vscode: VsCodeApi | null, dispatcher: MessageDispatcher): void {
  const {
    onAddMessage,
    onShowTyping,
    onStreamTimelineDelta,
    onStreamTimelineToolGroup,
    onStreamDone,
    onStreamError,
    onClearChat,
    onModelChanged,
    onApiKeyStatus,
    onConfigLoaded,
    onToolCallStarted,
    onToolCallResult,
    onToolCallActionAccepted,
    onToolCallConfirmationRequired,
    onToolCallLimitReached,
  } = dispatcher;

  useEffect(() => {
    if (!vscode) {
      return;
    }

    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "addMessage":
          onAddMessage?.(message.message);
          break;

        case "showTyping":
          onShowTyping?.();
          break;

        case "streamTimelineDelta":
          onStreamTimelineDelta?.({ eventId: message.eventId, eventType: message.eventType, content: message.content });
          break;

        case "streamTimelineToolGroup":
          onStreamTimelineToolGroup?.(message.event);
          break;

        case "streamDone":
          onStreamDone?.({
            cancelled: message.cancelled,
            finish_reason: message.finish_reason,
          });
          break;

        case "streamError":
          onStreamError?.(message.error);
          break;

        case "clearChat":
          onClearChat?.();
          break;

        case "modelChanged":
          onModelChanged?.(message.modelId);
          break;

        case "apiKeyStatus":
          onApiKeyStatus?.(message.status);
          break;

        case "configLoaded":
          if (message.config.interfaceLanguage) {setInterfaceLanguage(message.config.interfaceLanguage);}
          onConfigLoaded?.(message.config);
          break;

        case "toolCallStarted":
          onToolCallStarted?.({
            toolCalls: message.toolCalls,
            round: message.round,
          });
          break;

        case "toolCallResult":
          onToolCallResult?.({
            toolCallId: message.toolCallId,
            toolName: message.toolName,
            result: message.result,
            isError: message.isError,
            rejected: message.rejected,
            status: message.status,
          });
          break;

        case "toolCallActionAccepted":
          onToolCallActionAccepted?.({ toolCallId: message.toolCallId, status: message.status });
          break;

        case "toolCallConfirmationRequired":
          onToolCallConfirmationRequired?.({
            toolCalls: message.toolCalls,
            round: message.round,
            autoExecute: message.autoExecute,
            dangerConfirmation: message.dangerConfirmation,
          });
          break;

        case "toolCallLimitReached":
          onToolCallLimitReached?.({ completedRounds: message.completedRounds, batchSize: message.batchSize });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "getConfig" });

    return () => window.removeEventListener("message", handleMessage);
  }, [
    vscode,
    onAddMessage,
    onShowTyping,
    onStreamTimelineDelta,
    onStreamTimelineToolGroup,
    onStreamDone,
    onStreamError,
    onClearChat,
    onModelChanged,
    onApiKeyStatus,
    onConfigLoaded,
    onToolCallStarted,
    onToolCallResult,
    onToolCallActionAccepted,
    onToolCallConfirmationRequired,
    onToolCallLimitReached,
  ]);
}
