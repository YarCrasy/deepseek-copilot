import type { ToolCall, ToolDefinition, ToolExecutionMode } from "@/adapters";
import { runToolCallCycle } from "@/deepseek-api/providers/deepseek/features/toolCall";
import { logWarning } from "@/shared/logging/logger";
import type { ToolExecutor } from "@/core/tools/ToolExecutor";
import type { ConfirmationRequiredResult } from "@/core/tools/types";
import { requestDangerConfirmation } from "./dangerConfirmation";
import { cancelPendingToolCallCycle, createPendingToolCallCycle, resolveToolCallAction } from "./pendingCycle";
import { executeToolCall } from "./toolExecution";
import type {
  HandleRunErrorOptions,
  PendingDangerConfirmation,
  PendingToolCallCycle,
  PostFinalMessageOptions,
  StoredExecution,
  ToolCallActionPayload,
  ToolCallRunOptions,
  ToolCallRunResult,
} from "./types";

export class ToolCallSession {
  private pendingToolCallCycle: PendingToolCallCycle | null = null;
  private pendingDangerConfirmation: PendingDangerConfirmation | null = null;
  private readonly trustedDangerKeys = new Set<string>();
  private currentRound = 0;
  constructor(private readonly toolExecutor: ToolExecutor) {}

  async run(options: ToolCallRunOptions): Promise<ToolCallRunResult | undefined> {
    let streamedContent = "";
    let streamedReasoning = "";
    const executedToolCalls = new Map<string, StoredExecution>();
    const enabledTools = getRunnableTools(options);

    try {
      const result = await runToolCallCycle({
        initialMessages: options.messages,
        tools: enabledTools,
        model: options.providerConfig.model,
        apiKey: options.providerConfig.apiKey,
        baseUrl: options.providerConfig.baseUrl,
        executeToolCall: (toolCall) => executeToolCall(toolCall, this.createExecutionContext(options, executedToolCalls)),
        cycleOptions: {
          maxRounds: 6,
          signal: options.signal,
          streamFinalResponse: true,
          streamToolCallRounds: hasAutoApprovedTools(options, enabledTools),
          thinkingMode: options.providerConfig.thinkingMode,
          reasoningEffort: options.providerConfig.reasoningEffort as "high" | "max" | undefined,
          maxTokens: options.providerConfig.maxTokens,
          responseFormat: options.providerConfig.responseFormat,
          userId: options.providerConfig.userId,
          onRoundStart: (round, toolCalls) => this.handleRoundStart(round, toolCalls, options),
          onStreamChunk: (content) => {
            streamedContent += content;
            options.webviewView.webview.postMessage({ type: "streamChunk", content });
          },
          onStreamReasoning: (reasoning) => {
            streamedReasoning += reasoning;
            if (options.exposeReasoning) {
              options.webviewView.webview.postMessage({ type: "streamReasoning", content: reasoning });
            }
          },
        },
      });

      return this.postFinalMessage({ options, result, executedToolCalls, streamedContent, streamedReasoning });
    } catch (err: unknown) {
      return this.handleRunError({ err, options, executedToolCalls, streamedContent, streamedReasoning });
    } finally {
      this.pendingToolCallCycle = null;
      this.pendingDangerConfirmation = null;
    }
  }

  cancel(): void {
    if (this.pendingToolCallCycle) {
      cancelPendingToolCallCycle(this.pendingToolCallCycle);
    }
    if (this.pendingDangerConfirmation) {
      this.pendingDangerConfirmation.resolve({ confirmed: false, trustForSession: false });
    }
    this.pendingToolCallCycle = null;
    this.pendingDangerConfirmation = null;
    this.trustedDangerKeys.clear();
  }

  resetSessionTrust(): void {
    this.trustedDangerKeys.clear();
  }

  handleUserAction(payload: ToolCallActionPayload): void {
    if (this.pendingDangerConfirmation?.toolCall.id === payload.toolCallId) {
      this.pendingDangerConfirmation.resolve({
        confirmed: payload.action === "execute",
        trustForSession: payload.action === "execute" ? payload.trustForSession : false,
      });
      return;
    }

    if (!this.pendingToolCallCycle) {
      logWarning("[ChatHandler] No pending tool call cycle for manual execution");
      return;
    }

    const actionResult = resolveToolCallAction(this.pendingToolCallCycle, payload.toolCallId, payload.action);
    if (actionResult === "missing") {
      logWarning(`[ChatHandler] Tool call ${payload.toolCallId} not found in pending cycle`);
    } else if (actionResult === "duplicate") {
      logWarning(`[ChatHandler] Tool call ${payload.toolCallId} already resolved`);
    }
  }

  private createExecutionContext(options: ToolCallRunOptions, executedToolCalls: Map<string, StoredExecution>) {
    return {
      toolExecutor: this.toolExecutor,
      webviewView: options.webviewView,
      executedToolCalls,
      getToolMode: (toolName: string) => getToolMode(options, toolName),
      shouldSkipManualConfirmation: (toolName: string) => shouldSkipManualConfirmation(toolName),
      getCurrentRound: () => this.currentRound,
      getPendingCycle: () => this.pendingToolCallCycle,
      isDangerTrusted: (toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult) => this.isDangerTrusted(toolCall, confirmationResult),
      trustDangerForSession: (toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult) => {
        if (canTrustDanger(confirmationResult)) {
          this.trustedDangerKeys.add(createDangerTrustKey(toolCall, confirmationResult));
        }
      },
      requestDangerConfirmation: (
        toolCall: ToolCall,
        confirmationResult: ConfirmationRequiredResult,
        dangerOptions?: { announceStarted?: boolean; round?: number },
      ) =>
        requestDangerConfirmation({
          webviewView: options.webviewView,
          toolCall,
          confirmationResult,
          setPendingDangerConfirmation: (value) => {
            this.pendingDangerConfirmation = value;
          },
          ...dangerOptions,
        }),
    };
  }

  private isDangerTrusted(toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult): boolean {
    return canTrustDanger(confirmationResult) && this.trustedDangerKeys.has(createDangerTrustKey(toolCall, confirmationResult));
  }

  private async handleRoundStart(round: number, toolCalls: ToolCall[], options: ToolCallRunOptions): Promise<void> {
    this.currentRound = round;
    options.webviewView.webview.postMessage({ type: "toolCallStarted", toolCalls, round });

    const manualToolCalls = toolCalls.filter((toolCall) => getToolMode(options, toolCall.function.name) === "enabled" && !shouldSkipManualConfirmation(toolCall.function.name));
    if (manualToolCalls.length === 0) {
      return;
    }

    const pendingCycle = createPendingToolCallCycle(manualToolCalls, round);
    this.pendingToolCallCycle = pendingCycle;
    options.webviewView.webview.postMessage({
      type: "toolCallConfirmationRequired",
      toolCalls: manualToolCalls,
      round,
      autoExecute: false,
    });

    await pendingCycle.batchPromise;
  }

  private postFinalMessage({ options, result, executedToolCalls, streamedContent, streamedReasoning }: PostFinalMessageOptions): ToolCallRunResult {
    const toolCallResults = Array.from(executedToolCalls.values());
    const hasStreamedContent = streamedContent.length > 0 || streamedReasoning.length > 0;

    if (result.finalMessage.content || toolCallResults.length > 0) {
      options.webviewView.webview.postMessage({
        type: "addMessage",
        message: {
          role: "assistant",
          content: hasStreamedContent ? "" : (result.finalMessage.content ?? ""),
          wasStreamed: hasStreamedContent,
          toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
        },
      });
    }

    options.webviewView.webview.postMessage({
      type: "streamDone",
      finish_reason: result.response.choices[0]?.finish_reason ?? "stop",
      usage: result.response.usage,
    });

    return {
      content: hasStreamedContent ? streamedContent : (result.finalMessage.content ?? ""),
      reasoning: hasStreamedContent ? streamedReasoning : (result.finalMessage.reasoning_content ?? undefined),
      toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
    };
  }

  private handleRunError({ err, options, executedToolCalls, streamedContent, streamedReasoning }: HandleRunErrorOptions): ToolCallRunResult | undefined {
    if (isCancellationError(err)) {
      const partialToolCalls = Array.from(executedToolCalls.values());
      const hasPartial = streamedContent.length > 0 || streamedReasoning.length > 0 || partialToolCalls.length > 0;

      if (!options.isCancelling()) {
        if (partialToolCalls.length > 0) {
          options.webviewView.webview.postMessage({
            type: "addMessage",
            message: {
              role: "assistant",
              content: streamedContent || "",
              wasStreamed: streamedContent.length > 0,
              toolCalls: partialToolCalls,
            },
          });
        }
        options.webviewView.webview.postMessage({ type: "streamDone", cancelled: true });
      }

      return hasPartial
        ? {
            content: streamedContent,
            reasoning: streamedReasoning || undefined,
            toolCalls: partialToolCalls.length > 0 ? partialToolCalls : undefined,
            partial: true,
          }
        : undefined;
    }

    options.webviewView.webview.postMessage({
      type: "streamError",
      error: `Error en tool calls: ${getErrorMessage(err)}`,
    });
    return undefined;
  }
}

function canTrustDanger(confirmationResult: ConfirmationRequiredResult): boolean {
  return confirmationResult.dangerLevel !== "destructive";
}

function createDangerTrustKey(toolCall: ToolCall, confirmationResult: ConfirmationRequiredResult): string {
  return `${toolCall.function.name}:${confirmationResult.dangerLevel}`;
}

function isCancellationError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "Canceled");
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function hasAutoApprovedTools(options: ToolCallRunOptions, tools: ToolDefinition[]): boolean {
  return tools.some((tool) => getToolMode(options, tool.function.name) === "auto_approve");
}

function getRunnableTools(options: ToolCallRunOptions): ToolDefinition[] {
  return options.tools.filter((tool) => getToolMode(options, tool.function.name) !== "disabled");
}

function getToolMode(options: ToolCallRunOptions, toolName: string): ToolExecutionMode {
  return options.toolExecutionModes[toolName] ?? "enabled";
}

function shouldSkipManualConfirmation(toolName: string): boolean {
  return toolName === "edit_file" || toolName === "apply_patch";
}
