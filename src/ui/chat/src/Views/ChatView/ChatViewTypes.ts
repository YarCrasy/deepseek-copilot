// ── Tipos compartidos entre ChatView y sus secciones ──

import type { ConversationMessage, StoredToolCall, DangerConfirmationData } from "@/adapters/message";

export type { StoredToolCall, DangerConfirmationData };

export type ChatRole = "user" | "assistant" | "error" | "tool";

export type ChatMessage = ConversationMessage;

export type ApiKeyStatus = "missing" | "configured";

export type InitialConfig = {
  provider?: string;
  reasoning?: string;
  model?: string;
};

/** Valores UI de razonamiento (mapean a thinkingMode + reasoningEffort) */
export type ReasoningValue = "off" | "low" | "medium" | "high" | "max";

/** Acción que el usuario puede tomar sobre una tool call */
export type ToolCallAction = "execute" | "reject";
export type ToolCallActionOptions = {
  trustForSession?: boolean;
};

/** Estado de una tool call en ejecución */
export type ToolCallStatus = "pending" | "running" | "completed" | "error" | "rejected";

/** Nivel de peligrosidad de una herramienta */
export type DangerLevel = "safe" | "caution" | "dangerous" | "destructive";

// DangerConfirmationData importado de @/adapters/message

/** Tool call en la UI (se agrupa por turno) */
export interface ToolCallState {
  toolCallId: string;
  toolName: string;
  arguments: string;
  status: ToolCallStatus;
  result?: string;
  round: number;
  requiresConfirmation?: boolean;
  /** Datos de peligrosidad si la herramienta requiere confirmación extra */
  dangerConfirmation?: DangerConfirmationData;
  /** Si la tool call fue rechazada por el usuario */
  rejected?: boolean;
  /** Nivel de peligrosidad registrado */
  dangerLevel?: string;
  /** Si el peligro fue confirmado */
  dangerConfirmed?: boolean;
}

/** Grupo de tool calls del mismo turno */
export interface ToolCallGroup {
  id: string; // ID único del grupo (ej: "tool-round-1")
  round: number;
  toolCalls: ToolCallState[];
  expanded: boolean;
}

/** Acciones disponibles en los botones de bloques de código */
export type CodeAction = "copy" | "insert";

/** Props del componente MsgsHandler */
export type MsgsHandlerProps = {
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
