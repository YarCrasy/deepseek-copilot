import type { ToolCall } from "@/adapters";
import { ToolExecutor } from "@/core/tools/ToolExecutor";
import { getToolWorkspaceHost } from "@/core/tools/ToolWorkspace";
import type { ExecutionResult } from "@/core/tools/Types";
import type { HandleExecutionResultOptions, StoredExecution, ToolExecutionContext } from "./Types";

const DANGER_CANCELLED = "Tool call cancelled by user (dangerous operation)";
const USER_REJECTED = "Tool call rejected by user";
const CYCLE_UNAVAILABLE = "Tool call cycle not available";
const TOOL_DISABLED = "Tool call rejected because the tool is disabled";

export async function executeToolCall(toolCall: ToolCall, ctx: ToolExecutionContext): Promise<string> {
  recordInitialToolCall(toolCall, ctx);

  const mode = ctx.getToolMode(toolCall.function.name);
  if (mode === "disabled") {
    ctx.webviewView.webview.postMessage({
      type: "toolCallResult",
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result: TOOL_DISABLED,
      isError: true,
    });
    updateStoredToolCall(ctx, toolCall.id, { result: TOOL_DISABLED, isError: true, rejected: true });
    return TOOL_DISABLED;
  }

  if (mode === "enabled" && !ctx.shouldSkipManualConfirmation(toolCall.function.name)) {
    return executeManualToolCall(toolCall, ctx);
  }

  const result = await ctx.toolExecutor.execute(toolCall, { signal: ctx.signal });
  return handleExecutionResult({
    toolCall,
    result,
    ctx,
    announceStarted: true,
    round: ctx.getCurrentRound(),
  });
}

function recordInitialToolCall(toolCall: ToolCall, ctx: ToolExecutionContext): void {
  ctx.executedToolCalls.set(toolCall.id, {
    toolCallId: toolCall.id,
    toolName: toolCall.function.name,
    arguments: toolCall.function.arguments,
    round: ctx.getCurrentRound(),
    requiresConfirmation: ctx.getToolMode(toolCall.function.name) === "enabled" && !ctx.shouldSkipManualConfirmation(toolCall.function.name),
  });
}

async function executeManualToolCall(toolCall: ToolCall, ctx: ToolExecutionContext): Promise<string> {
  const individualPromise = ctx.getPendingCycle()?.individualPromises.get(toolCall.id);
  if (!individualPromise) {
    updateStoredToolCall(ctx, toolCall.id, { result: CYCLE_UNAVAILABLE, isError: true });
    return CYCLE_UNAVAILABLE;
  }

  const action = await individualPromise;
  if (action === "reject") {
    ctx.webviewView.webview.postMessage({
      type: "toolCallResult",
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result: USER_REJECTED,
      isError: true,
      rejected: true,
    });
    updateStoredToolCall(ctx, toolCall.id, {
      result: USER_REJECTED,
      isError: true,
      rejected: true,
    });
    return USER_REJECTED;
  }

  const result = await ctx.toolExecutor.execute(toolCall, { signal: ctx.signal });
  return handleExecutionResult({
    toolCall,
    result,
    ctx,
    round: ctx.getCurrentRound(),
  });
}

async function handleExecutionResult(options: HandleExecutionResultOptions): Promise<string> {
  const { toolCall, result, ctx, announceStarted, round } = options;

  const dangerInfo = ToolExecutor.isConfirmationRequired(result.result);
  updateStoredToolCall(ctx, toolCall.id, {
    result: result.result,
    isError: result.isError,
    dangerLevel: dangerInfo?.dangerLevel,
  });

  if (!dangerInfo) {
    postToolCallResult(ctx, result);
    return result.result;
  }

  if (ctx.isDangerTrusted(toolCall, dangerInfo)) {
    return executeForcedAfterTrust(toolCall, ctx);
  }

  const decision = await ctx.requestDangerConfirmation(toolCall, dangerInfo, { announceStarted, round });
  if (!decision.confirmed) {
    clearFileDiffPreview();
    postToolCallResult(ctx, {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result: DANGER_CANCELLED,
      isError: true,
      rejected: true,
    });
    updateStoredToolCall(ctx, toolCall.id, {
      result: DANGER_CANCELLED,
      isError: true,
      dangerConfirmed: false,
      rejected: true,
    });
    return DANGER_CANCELLED;
  }

  if (decision.trustForSession) {
    ctx.trustDangerForSession(toolCall, dangerInfo);
  }

  return executeForcedAfterTrust(toolCall, ctx);
}

function clearFileDiffPreview(): void {
  getToolWorkspaceHost().clearFileDiffPreview?.();
}

async function executeForcedAfterTrust(toolCall: ToolCall, ctx: ToolExecutionContext): Promise<string> {
  const forcedResult = await ctx.toolExecutor.executeForced(toolCall, { signal: ctx.signal });
  postToolCallResult(ctx, forcedResult);
  updateStoredToolCall(ctx, toolCall.id, {
    result: forcedResult.result,
    isError: forcedResult.isError,
    dangerConfirmed: true,
  });
  return forcedResult.result;
}

function postToolCallResult(ctx: ToolExecutionContext, result: ExecutionResult & { rejected?: boolean }): void {
  ctx.webviewView.webview.postMessage({
    type: "toolCallResult",
    toolCallId: result.toolCallId,
    toolName: result.toolName,
    result: result.result,
    isError: result.isError,
    rejected: result.rejected,
  });
}

function updateStoredToolCall(ctx: ToolExecutionContext, toolCallId: string, patch: Partial<StoredExecution>): void {
  const existing = ctx.executedToolCalls.get(toolCallId);
  if (existing) {
    Object.assign(existing, patch);
  }
}
