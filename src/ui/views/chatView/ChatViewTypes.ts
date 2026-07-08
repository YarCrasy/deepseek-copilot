import type { ConversationMessage, StoredToolCall, DangerConfirmationData } from "@/adapters/messages/Webview";

export type { StoredToolCall, DangerConfirmationData };

export type ChatMessage = ConversationMessage;

export type ApiKeyStatus = "missing" | "configured";

export type InitialConfig = {
  provider?: string;
  reasoning?: string;
  model?: string;
};

/** User action for a tool call. */
export type ToolCallAction = "execute" | "reject";
export type ToolCallActionOptions = {
  trustForSession?: boolean;
};

/** UI status for a tool call. */
type ToolCallStatus = "pending" | "running" | "completed" | "error" | "rejected";

/** UI tool call state. */
export interface ToolCallState {
  toolCallId: string;
  toolName: string;
  arguments: string;
  status: ToolCallStatus;
  result?: string;
  round: number;
  requiresConfirmation?: boolean;
  /** Danger details when the tool requires extra confirmation. */
  dangerConfirmation?: DangerConfirmationData;
  /** Whether the user rejected the tool call. */
  rejected?: boolean;
  /** Recorded danger level. */
  dangerLevel?: string;
  /** Whether the danger was confirmed by the user. */
  dangerConfirmed?: boolean;
}

/** Group of tool calls from the same round. */
export interface ToolCallGroup {
  id: string;
  round: number;
  toolCalls: ToolCallState[];
  expanded: boolean;
}

/** Available code-block button actions. */
export type CodeAction = "copy" | "insert";

/** Chat message section props. */
export type MessagesSectionProps = {
  messages?: ChatMessage[];
  onMessagesChange?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isProcessing?: boolean;
  listRef?: React.RefObject<HTMLDivElement | null>;
  onApiKeyStatusChange?: (status: ApiKeyStatus) => void;
  onConfigLoaded?: (config: InitialConfig) => void;
  onModelChanged?: (modelId: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  onFocusInput?: () => void;
  onGenerationCancelled?: () => void;
};
