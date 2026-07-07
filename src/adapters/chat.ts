import { logWarning } from "@/shared/logging/logger";

// ── Tipos compartidos de Chat ──
// Fuente única de verdad para BaseProvider.ts y features/chat.ts
// ADR-001: Los tipos compartidos viven en types/

// ── Roles de mensaje ──
export type MessageRole = "system" | "user" | "assistant" | "tool";

// ── System Prompt ──
// Define el rol, contexto y capacidades del copilot.
// Se inyecta como primer mensaje role:'system' en cada request a la API.
// ADR-001: Los tipos compartidos viven en types/
export const SYSTEM_PROMPT_COPILOT = `You are **DeepSeek Copilot** running inside VS Code. You are an AI coding assistant specialized in helping with code generation, debugging, refactoring, and answering technical questions.

## Available Tools
- **read_file**: Read files in the workspace. Pass \`filepath\` (relative to workspace root).
- **create_file**: Create new files. Pass \`filepath\` and \`content\`. Overwriting existing files requires user confirmation.
- **run_terminal_command**: Run terminal commands. Pass \`command\` string. Destructive commands (rm, git reset --hard, etc.) require user confirmation before execution — you can safely suggest them when needed. Timeout: 30s.
- **list_directory**: List files and directories. Pass \`dirPath\` (workspace-relative path).
- **search_content**: Search file contents. Pass \`query\` (regex) and optional \`path\` filter.

## Tool Usage Guidelines
- Prefer using tools to get real data rather than guessing or hallucinating.
- Read a file before modifying it to understand its current state.
- Destructive operations are safe to suggest — the extension will prompt the user for confirmation.
- After a tool returns results, analyze them and decide next steps.

## Thinking Mode & Tools
- When reasoning is enabled, you can use tools while thinking — they work together.
- Your internal reasoning is sent as \`reasoning_content\`; your public response as \`content\`.
- Tool calls happen inline during reasoning — you don't need to finish reasoning before using a tool.
- When a tool returns results, incorporate them into your ongoing reasoning.
- **Strategy**: Use tools proactively. If a task requires information or actions, invoke the tool immediately rather than describing what you would do.

## Response Format
- Use code blocks with language tags for code snippets.
- Explain your reasoning briefly before showing code.
- Be concise and professional.`;

/**
 * Verifica si el array de mensajes ya contiene un system prompt en cualquier posiciÃ³n.
 */
export function hasSystemPrompt(messages: ChatMessage[]): boolean {
  return messages.some((msg) => msg.role === "system");
}

/**
 * Asegura que el array de mensajes tenga exactamente UN system prompt al inicio.
 * - Si ya hay un system prompt en posiciÃ³n 0: no hace nada
 * - Si hay un system prompt en otra posiciÃ³n: lo mueve al inicio
 * - Si no hay system prompt: aÃ±ade createSystemMessage() al inicio
 * - Si hay mÃºltiples system prompts: elimina los duplicados (conserva el primero)
 *
 * @param messages - Array de mensajes (potencialmente del historial)
 * @param createSystemMessageFn - FunciÃ³n para crear system message (inyecciÃ³n de dependencias)
 * @returns Nuevo array con exactamente un system prompt al inicio
 */
export function ensureSingleSystemPrompt(messages: ChatMessage[], createSystemMessageFn: () => ChatMessage): ChatMessage[] {
  // Encontrar todos los system prompts
  const systemPrompts = messages.filter((msg) => msg.role === "system");
  const nonSystemMessages = messages.filter((msg) => msg.role !== "system");

  if (systemPrompts.length === 0) {
    // No hay system prompt â†’ aÃ±adir uno nuevo al inicio
    return [createSystemMessageFn(), ...messages];
  }

  // Hay al menos un system prompt â†’ usar el primero y eliminar duplicados
  return [systemPrompts[0], ...nonSystemMessages];
}

// ── Tool calls ──
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
  /** Índice SSE para chunks parciales de streaming tool calls */
  index?: number;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>; // JSON Schema
    strict?: boolean;
  };
}

export type ToolChoice = "none" | "auto" | "required" | { type: "function"; function: { name: string } };

// ── ChatMessage ──
export interface ChatMessage {
  role: MessageRole;
  content: string | null;
  reasoning_content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * Mapea el valor de reasoning desde la UI al valor de reasoning_effort para la API.
 *
 * @param reasoning - Valor desde la UI: 'off' | 'low' | 'medium' | 'high' | 'max' | undefined
 * @returns Valor para la API: 'high' | 'max' | undefined
 *          - undefined: no enviar reasoning_effort (thinking desactivado)
 *          - 'high': razonamiento estándar
 *          - 'max': razonamiento profundo
 *
 * ADR-006: DeepSeek solo usa 'high' y 'max'. low/medium se mapean a 'high'.
 *          Cualquier valor no reconocido se trata como 'high' (fallback seguro).
 *
 * @note Esta función es la ÚNICA fuente de verdad para el mapeo reasoning_effort.
 *       Todos los consumidores (ChatHandler, buildChatBody, tool calls) deben usarla.
 */
export function mapReasoningEffort(reasoning: string | undefined): "high" | "max" | undefined {
  if (!reasoning || reasoning === "off") {return undefined;}

  // low/medium se tratan como 'high' para DeepSeek (ADR-006)
  if (reasoning === "low" || reasoning === "medium") {return "high";}

  // Valores válidos: 'high', 'max' (fallback seguro: cualquier otro → 'high')
  return reasoning === "max" ? "max" : "high";
}

/**
 * Crea el mensaje de sistema que se inyecta como PRIMER mensaje en toda request.
 *
 * El system prompt define el rol y comportamiento del asistente (DeepSeek Copilot
 * en VS Code), las herramientas disponibles, y las reglas de interacción.
 *
 * @returns Un objeto con role='system' y content=SYSTEM_PROMPT_COPILOT
 *
 * @note Esta función es la ÚNICA forma de crear el system prompt. Todos los
 *       consumidores (ChatHandler._sendMessage, toolCall.runToolCallCycle) deben
 *       usarla. No crear system prompts manualmente.
 *
 * @warning Si SYSTEM_PROMPT_COPILOT está vacío o es undefined, el mensaje de sistema
 *          contendrá una string vacía, lo cual puede causar comportamiento inesperado
 *          en la API (pérdida de instrucciones de sistema).
 */
export function createSystemMessage(): Pick<ChatMessage, "role" | "content"> {
  // Validación en desarrollo para detectar contenido vacío
  if (process.env.NODE_ENV === "development" && !SYSTEM_PROMPT_COPILOT?.trim()) {
    logWarning("[createSystemMessage] SYSTEM_PROMPT_COPILOT está vacío. " + "Las requests no tendrán instrucciones de sistema.");
  }

  return {
    role: "system" as const,
    content: SYSTEM_PROMPT_COPILOT,
  };
}

// ── Usage ──
export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
}

// ── ChatCompletionRequest ──
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  stream_options?: {
    include_usage?: boolean;
  };
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  thinking?: { type: "enabled" | "disabled" };
  reasoning_effort?: "high" | "max";
  response_format?: { type: "text" | "json_object" };
  stop?: string[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  user_id?: string;
}

// ── ChatCompletionResponse ──
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "insufficient_system_resource" | null;
    logprobs?: unknown;
  }>;
  usage?: ChatUsage;
}

// ── StreamChunk ──
export interface StreamChunk {
  type: "content" | "reasoning" | "tool_call" | "done" | "error";
  content?: string;
  reasoning_content?: string;
  finish_reason?: string;
  usage?: ChatUsage;
  error?: string;
  tool_calls?: ToolCall[];
}
