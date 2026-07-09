import { logWarning } from "@/shared/logging/Logger";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export const SYSTEM_PROMPT_COPILOT = `You are Yar's DeepSeek Copilot inside VS Code: a concise coding assistant for code understanding, debugging, refactoring, and generation.

Tools use workspace-relative paths:
- read_file {path}
- list_directory {path, showHidden}
- search_content {query, filePattern}
- create_file {path, content}
- edit_file {path, search, replace, replaceAll}
- apply_patch {path, diff, expectedBeforeHash}
- run_terminal_command {command, cwd}

Use tools instead of guessing when tools are available. Tools require thinking mode. Read files before editing. For apply_patch, pass the sha256 from read_file as expectedBeforeHash when available. After a successful create_file, edit_file, or apply_patch result, stop calling tools and answer from the tool result; do not re-read only to verify. If an edit fails, recover with the fewest tool calls possible. Destructive writes/commands are allowed to propose; the extension asks the user for confirmation. Keep answers concise, use language-tagged code blocks, and report only relevant reasoning/results.`;

/**
 * Ensures that a message list has exactly one system prompt at the beginning.
 */
export function ensureSingleSystemPrompt(messages: ChatMessage[], createSystemMessageFn: () => ChatMessage): ChatMessage[] {
  const systemPrompts = messages.filter((msg) => msg.role === "system");
  const nonSystemMessages = messages.filter((msg) => msg.role !== "system");

  if (systemPrompts.length === 0) {
    return [createSystemMessageFn(), ...messages];
  }

  return [systemPrompts[0], ...nonSystemMessages];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
  /** SSE index for partial streaming tool-call chunks. */
  index?: number;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

export type ToolChoice = "none" | "auto" | "required" | { type: "function"; function: { name: string } };

export interface ChatMessage {
  role: MessageRole;
  content: string | null;
  reasoning_content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * Maps the UI reasoning value to DeepSeek's reasoning_effort.
 */
export function mapReasoningEffort(reasoning: string | undefined): "high" | "max" | undefined {
  if (!reasoning || reasoning === "off") {return undefined;}

  if (reasoning === "low" || reasoning === "medium") {return "high";}

  return reasoning === "max" ? "max" : "high";
}

/**
 * Creates the system message injected at the beginning of API requests.
 */
export function createSystemMessage(): Pick<ChatMessage, "role" | "content"> {
  if (process.env.NODE_ENV === "development" && !SYSTEM_PROMPT_COPILOT?.trim()) {
    logWarning("[createSystemMessage] SYSTEM_PROMPT_COPILOT is empty. Requests will not include system instructions.");
  }

  return {
    role: "system" as const,
    content: SYSTEM_PROMPT_COPILOT,
  };
}

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

export interface StreamChunk {
  type: "content" | "reasoning" | "tool_call" | "done" | "error";
  content?: string;
  reasoning_content?: string;
  finish_reason?: string;
  usage?: ChatUsage;
  error?: string;
  tool_calls?: ToolCall[];
}
