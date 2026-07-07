import { useEffect } from "react";
import type { VsCodeApi } from "@webview/vscodeApi";
import type { HandlerToWebviewMessage, AppConfig, ToolCall } from "@/adapters";
import type { ApiKeyStatus, DangerConfirmationData } from "../ChatViewTypes";

/**
 * Informacion adicional del evento streamDone.
 */
export type StreamDoneInfo = {
  cancelled?: boolean;
  finish_reason?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
};

/**
 * Interfaz del dispatcher: objeto con metodos opcionales para cada tipo de mensaje.
 * Se pasa desde MsgsHandler conectando cada caso con la logica de negocio.
 */
export type MessageDispatcher = {
  onAddMessage?: (message: {
    role: string;
    content: string;
    wasStreamed?: boolean;
    toolCalls?: Array<{
      toolCallId: string;
      toolName: string;
      arguments: string;
      result?: string;
      isError?: boolean;
    }>;
    toolCallId?: string;
    toolName?: string;
  }) => void;
  onShowTyping?: () => void;
  onStreamChunk?: (content: string) => void;
  onStreamReasoning?: (content: string) => void;
  onStreamDone?: (info: StreamDoneInfo) => void;
  onStreamError?: (error: string) => void;
  onClearChat?: () => void;
  onModelChanged?: (modelId: string) => void;
  onApiKeyStatus?: (status: ApiKeyStatus) => void;
  onConfigLoaded?: (config: Partial<AppConfig>) => void;
  // ── Tool Calls (FASE 4) ──
  onToolCallStarted?: (data: { toolCalls: ToolCall[]; round: number }) => void;
  onToolCallResult?: (data: { toolCallId: string; toolName: string; result: string; isError?: boolean }) => void;
  onToolCallConfirmationRequired?: (data: { toolCalls: ToolCall[]; round: number; autoExecute: boolean; dangerConfirmation?: DangerConfirmationData }) => void;
};

/**
 * Hook que gestiona el listener de mensajes del webview.
 *
 * - Se suscribe a `window.addEventListener("message")`
 * - Enruta cada mensaje al metodo correspondiente del dispatcher
 * - Solicita la configuracion inicial al montar (`vscode.postMessage({ type: "getConfig" })`)
 * - Limpia el listener al desmontar
 *
 * @param vscode - Instancia de VsCodeApi (de useVsCode())
 * @param dispatcher - Objeto con metodos para cada tipo de mensaje
 */
export function useMessageHandler(vscode: VsCodeApi | null, dispatcher: MessageDispatcher): void {
  const {
    onAddMessage,
    onShowTyping,
    onStreamChunk,
    onStreamReasoning,
    onStreamDone,
    onStreamError,
    onClearChat,
    onModelChanged,
    onApiKeyStatus,
    onConfigLoaded,
    onToolCallStarted,
    onToolCallResult,
    onToolCallConfirmationRequired,
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

        case "streamChunk":
          onStreamChunk?.(message.content);
          break;

        case "streamReasoning":
          onStreamReasoning?.(message.content);
          break;

        case "streamDone":
          onStreamDone?.({
            cancelled: message.cancelled,
            finish_reason: message.finish_reason,
            usage: message.usage,
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
          onConfigLoaded?.(message.config);
          break;

        // ── Tool Calls (FASE 4) ──
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
          });
          break;

        case "toolCallConfirmationRequired":
          onToolCallConfirmationRequired?.({
            toolCalls: message.toolCalls,
            round: message.round,
            autoExecute: message.autoExecute,
            dangerConfirmation: message.dangerConfirmation,
          });
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
    onStreamChunk,
    onStreamReasoning,
    onStreamDone,
    onStreamError,
    onClearChat,
    onModelChanged,
    onApiKeyStatus,
    onConfigLoaded,
    onToolCallStarted,
    onToolCallResult,
    onToolCallConfirmationRequired,
  ]);
}
