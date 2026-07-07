// ── Tipos de mensajes compartidos webview ↔ handler ──
import type { AppConfig } from "./config";
import type { ToolCall } from "./chat";

// ── Tipos compartidos para Tool Calls ──

/** Tool call information stored in a message (for persistence) */
export interface StoredToolCall {
  toolCallId: string;
  toolName: string;
  arguments: string;
  result?: string;
  isError?: boolean;
  round?: number;
  rejected?: boolean;
  requiresConfirmation?: boolean;
  dangerLevel?: string;
  dangerConfirmed?: boolean;
}

/** Datos de confirmación de peligro */
export interface DangerConfirmationData {
  requiresConfirmation: true;
  dangerLevel: "safe" | "caution" | "dangerous" | "destructive";
  warningMessage: string;
  command?: string;
  filePath?: string;
  canTrustForSession?: boolean;
}

export type ConversationMessageRole = "user" | "assistant" | "error" | "tool";

export interface ConversationMessage {
  id: string;
  role: ConversationMessageRole;
  content: string;
  reasoning?: string;
  toolCalls?: StoredToolCall[];
  toolCallId?: string;
  toolName?: string;
  createdAt?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  model: string;
}

export interface AvailableToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface AvailableToolInfo {
  name: string;
  description: string;
  parameters: AvailableToolParameter[];
}

export interface PathCompletionItem {
  label: string;
  path: string;
  type: "file" | "directory";
}

// Mensajes que el Webview ENVÍA al handler
export type WebviewToHandlerMessage =
  | { type: "getConfig" }
  | { type: "saveConfig"; config: Partial<AppConfig> }
  | { type: "resetConfig" }
  | { type: "testConnection"; apiKey: string; baseUrl: string; model: string }
  | { type: "getProviders" }
  | {
      type: "sendMessage";
      text: string;
      modelId: string;
      reasoning: string;
      referencedFiles?: Array<{ path: string; content?: string; type: "file" | "directory" }>;
    }
  | { type: "cancelGeneration" }
  | { type: "streamResponse"; content: string; done: boolean }
  | { type: "copyCode"; code: string }
  | { type: "insertCode"; code: string }
  | { type: "selectModel"; modelId: string }
  | { type: "newConversation" }
  | { type: "getHistory" }
  | { type: "loadConversation"; id: string }
  | { type: "deleteConversation"; id: string }
  | { type: "executeToolCall"; toolCallId: string; action: "execute" | "reject"; trustForSession?: boolean }
  | { type: "processFileDrop"; uri: string }
  | { type: "getPathCompletions"; requestId: number; query: string }
  | { type: "getAvailableTools" }
  | { type: "openFile"; path: string; line?: number };

// Mensajes que el Handler ENVÍA al webview
export type HandlerToWebviewMessage =
  | { type: "configLoaded"; config: Partial<AppConfig> }
  | { type: "configSaved"; success: boolean }
  | { type: "configReset"; config: Partial<AppConfig> }
  | { type: "connectionTestResult"; success: boolean; error?: string }
  | { type: "providers"; providers: Array<{ id: string; name: string }> }
  | { type: "apiKeyStatusSettings"; status: "configured" | "missing"; keyPreview?: string }
  | { type: "apiKeyStatus"; status: "configured" | "missing"; keyPreview?: string }
  | { type: "showTyping" }
  | { type: "streamChunk"; content: string }
  | { type: "streamReasoning"; content: string }
  | {
      type: "streamDone";
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
    }
  | { type: "streamError"; error: string }
  | {
      type: "addMessage";
      message: {
        role: "user" | "assistant" | "tool";
        content: string;
        wasStreamed?: boolean;
        toolCalls?: StoredToolCall[];
        toolCallId?: string;
        toolName?: string;
      };
    }
  | { type: "clearChat" }
  | { type: "pathCompletions"; requestId: number; query: string; items: PathCompletionItem[] }
  | { type: "modelChanged"; modelId: string }
  | { type: "history"; conversations: Conversation[] }
  | { type: "conversationLoaded"; conversation: Conversation }
  | { type: "conversationDeleted"; id: string }
  | {
      type: "toolCallStarted";
      toolCalls: ToolCall[];
      round: number;
      totalRounds?: number;
    }
  | {
      type: "toolCallResult";
      toolCallId: string;
      toolName: string;
      result: string;
      isError?: boolean;
    }
  | {
      type: "toolCallConfirmationRequired";
      toolCalls: ToolCall[];
      round: number;
      autoExecute: boolean;
      /** Datos de peligrosidad cuando una herramienta detecta un comando peligroso */
      dangerConfirmation?: DangerConfirmationData;
    }
  | {
      type: "fileDropResult";
      files: Array<{
        path: string;
        name: string;
        content: string;
        language: string;
        type: "file" | "directory";
        size: number;
      }>;
    }
  | {
      type: "availableTools";
      tools: AvailableToolInfo[];
    };
