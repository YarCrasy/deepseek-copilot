import type { AppConfig } from "../Config";
import type { ToolCall } from "../deepseek/Chat";

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
  status: "pending" | "awaiting_confirmation" | "running" | "completed" | "rejected" | "cancelled" | "error";
}

export type AssistantTimelineEvent =
  | {
      id: string;
      type: "reasoning";
      content: string;
    }
  | {
      id: string;
      type: "content";
      content: string;
    }
  | {
      id: string;
      type: "tool-group";
      round: number;
      toolCallIds: string[];
    };

/** Additional confirmation data for dangerous tool calls. */
export interface DangerConfirmationData {
  requiresConfirmation: true;
  dangerLevel: "safe" | "caution" | "dangerous" | "destructive";
  warningMessage: string;
  command?: string;
  filePath?: string;
  cwd?: string;
  shell?: string;
  beforeHash?: string;
  canTrustForSession?: boolean;
}

export type ConversationMessageRole = "user" | "assistant" | "error" | "tool";

export interface ConversationMessage {
  id: string;
  role: ConversationMessageRole;
  content: string;
  timeline?: AssistantTimelineEvent[];
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
  workspaceUri: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  messageCount: number;
  sizeBytes: number;
  workspaceUri: string;
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

export interface ProjectInstructionStatusSource {
  path: string;
  scope: "home" | "workspace" | "workspace-local";
  precedence: number;
  bytes: number;
}

export type WebviewToHandlerMessage =
  | { type: "getConfig" }
  | { type: "saveConfig"; config: Partial<AppConfig> }
  | { type: "resetConfig" }
  | { type: "testConnection"; apiKey: string; baseUrl: string; model: string }
  | {
      type: "sendMessage";
      text: string;
      modelId: string;
      reasoning: string;
      referencedFiles?: Array<{ path: string; content?: string; type: "file" | "directory"; selection?: { startLine: number; startCharacter: number; endLine: number; endCharacter: number } }>;
    }
  | { type: "cancelGeneration" }
  | { type: "copyCode"; code: string }
  | { type: "insertCode"; code: string }
  | { type: "selectModel"; modelId: string }
  | { type: "newConversation" }
  | { type: "getHistory" }
  | { type: "loadConversation"; id: string }
  | { type: "deleteConversation"; id: string }
  | { type: "deleteConversations"; ids: string[] }
  | { type: "executeToolCall"; toolCallId: string; action: "execute" | "reject"; trustForSession?: boolean }
  | { type: "getPathCompletions"; requestId: number; query: string }
  | { type: "getAvailableTools" }
  | { type: "openFile"; path: string; line?: number };

export type HandlerToWebviewMessage =
  | { type: "configLoaded"; config: Partial<AppConfig> }
  | { type: "configSaved"; success: boolean }
  | { type: "configReset"; config: Partial<AppConfig> }
  | { type: "connectionTestResult"; success: boolean; error?: string }
  | { type: "apiKeyStatusSettings"; status: "configured" | "missing"; keyPreview?: string }
  | { type: "apiKeyStatus"; status: "configured" | "missing"; keyPreview?: string }
  | { type: "showTyping" }
  | { type: "streamTimelineDelta"; eventId: string; eventType: "reasoning" | "content"; content: string }
  | { type: "streamTimelineToolGroup"; event: Extract<AssistantTimelineEvent, { type: "tool-group" }> }
  | {
      type: "streamDone";
      cancelled?: boolean;
      finish_reason?: string;
    }
  | { type: "streamError"; error: string }
  | {
      type: "addMessage";
      message: {
        role: "user" | "assistant" | "tool";
        content: string;
        wasStreamed?: boolean;
        toolCalls?: StoredToolCall[];
        timeline?: AssistantTimelineEvent[];
        toolCallId?: string;
        toolName?: string;
      };
    }
  | { type: "clearChat" }
  | { type: "projectInstructionsStatus"; sources: ProjectInstructionStatusSource[]; homeAgentsAllowed: boolean }
  | { type: "pathCompletions"; requestId: number; query: string; items: PathCompletionItem[] }
  | { type: "modelChanged"; modelId: string }
  | { type: "history"; conversations: ConversationSummary[] }
  | { type: "historyError"; error: string }
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
      rejected?: boolean;
      status: "completed" | "rejected" | "cancelled" | "error";
    }
  | { type: "toolCallActionAccepted"; toolCallId: string; status: "running" | "rejected" }
  | {
      type: "toolCallConfirmationRequired";
      toolCalls: ToolCall[];
      round: number;
      autoExecute: boolean;
      /** Danger details when a tool detects an operation that needs confirmation. */
      dangerConfirmation?: DangerConfirmationData;
    }
  | {
      type: "availableTools";
      tools: AvailableToolInfo[];
    };
