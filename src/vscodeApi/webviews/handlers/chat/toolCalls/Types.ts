import type * as vscode from "vscode";
import type { AppConfig, ChatMessage, ToolCall, ToolDefinition, ToolExecutionMode, ToolExecutionModes } from "@/adapters";
import type { ToolCallCycleResult } from "@/deepseekApi/providers/deepseek/features/toolCall";
import type { ToolExecutor } from "@/core/tools/ToolExecutor";
import type { ConfirmationRequiredResult, ExecutionResult } from "@/core/tools/Types";
import type { StreamEventEmitter } from "../StreamEventEmitter";

export interface PendingToolCallCycle {
  toolCalls: Map<string, ToolCall>;
  round: number;
  individualResolves: Map<string, (action: ToolCallAction) => void>;
  individualPromises: Map<string, Promise<ToolCallAction>>;
  resolved: Set<string>;
  resolveBatch: () => void;
  batchPromise: Promise<void>;
}

export interface PendingDangerConfirmation {
  toolCall: ToolCall;
  resolve: (decision: DangerConfirmationDecision) => void;
  confirmationResult: ConfirmationRequiredResult;
}

export type ToolCallAction = "execute" | "reject";

export interface ToolCallActionPayload {
  toolCallId: string;
  action: ToolCallAction;
  trustForSession?: boolean;
}

export interface DangerConfirmationDecision {
  confirmed: boolean;
  trustForSession?: boolean;
}

export interface StoredExecution {
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

export interface ToolCallRunOptions {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  providerConfig: AppConfig;
  webviewView: vscode.WebviewView;
  toolExecutionModes: ToolExecutionModes;
  exposeReasoning: boolean;
  signal?: AbortSignal;
  isCancelling: () => boolean;
}

export interface ToolCallRunResult {
  content: string;
  reasoning?: string;
  toolCalls?: StoredExecution[];
  partial?: boolean;
}

export interface ToolExecutionContext {
  toolExecutor: ToolExecutor;
  webviewView: vscode.WebviewView;
  executedToolCalls: Map<string, StoredExecution>;
  getToolMode: (toolName: string) => ToolExecutionMode;
  shouldSkipManualConfirmation: (toolName: string) => boolean;
  getCurrentRound: () => number;
  getPendingCycle: () => PendingToolCallCycle | null;
  requestDangerConfirmation: (
    toolCall: ToolCall,
    confirmationResult: ConfirmationRequiredResult,
    options?: { announceStarted?: boolean; round?: number },
  ) => Promise<DangerConfirmationDecision>;
  isDangerTrusted: (toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult) => boolean;
  trustDangerForSession: (toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult) => void;
}

export interface HandleExecutionResultOptions {
  toolCall: ToolCall;
  result: ExecutionResult;
  ctx: ToolExecutionContext;
  announceStarted?: boolean;
  round: number;
}

export interface PostFinalMessageOptions {
  options: ToolCallRunOptions;
  stream: StreamEventEmitter;
  result: ToolCallCycleResult;
  executedToolCalls: Map<string, StoredExecution>;
  streamedContent: string;
  streamedReasoning: string;
}

export interface HandleRunErrorOptions {
  err: unknown;
  options: ToolCallRunOptions;
  stream: StreamEventEmitter;
  executedToolCalls: Map<string, StoredExecution>;
  streamedContent: string;
  streamedReasoning: string;
}
