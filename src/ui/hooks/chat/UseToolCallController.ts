import { useCallback, useMemo, useState } from "react";
import type { ToolCall } from "@/adapters";
import type { VsCodeApi } from "@webview/VsCodeApi";
import type { ChatMessage, ToolCallAction, ToolCallActionOptions, ToolCallGroup, ToolCallState } from "../../views/chatView/ChatViewTypes";
import type { MessageDispatcher } from "../../views/chatView/hooks";

interface ToolCallControllerOptions {
  messages: ChatMessage[];
  isProcessing: boolean;
  vscode: VsCodeApi | null;
}

export function useToolCallController({ messages, isProcessing, vscode }: ToolCallControllerOptions) {
  const [toolCallGroups, setToolCallGroups] = useState<ToolCallGroup[]>([]);

  const dispatcher: MessageDispatcher = {
    onToolCallStarted: useCallback((data) => {
      const newGroup = createToolCallGroup({
        toolCalls: data.toolCalls,
        round: data.round,
        status: "running",
      });
      setToolCallGroups((previous) => upsertToolCallGroup(previous, newGroup));
    }, []),

    onToolCallConfirmationRequired: useCallback((data) => {
      const newGroup = createToolCallGroup({
        toolCalls: data.toolCalls,
        round: data.round,
        status: "pending",
        requiresConfirmation: !data.autoExecute,
        dangerConfirmation: data.dangerConfirmation,
      });
      setToolCallGroups((previous) => mergeConfirmationGroup(previous, newGroup));
    }, []),

    onToolCallResult: useCallback((data) => {
      setToolCallGroups((previous) =>
        previous.map((group) => ({
          ...group,
          toolCalls: group.toolCalls.map((toolCall) =>
            toolCall.toolCallId === data.toolCallId
              ? {
                  ...toolCall,
                  status: data.rejected ? ("rejected" as const) : data.isError ? ("error" as const) : ("completed" as const),
                  result: data.result,
                  requiresConfirmation: false,
                  rejected: data.rejected,
                }
              : toolCall,
          ),
        })),
      );
    }, []),

    onClearChat: useCallback(() => setToolCallGroups([]), []),
  };

  const activeTimelineGroups = useMemo(() => getVisibleActiveGroups(messages, toolCallGroups), [messages, toolCallGroups]);

  const timelineMetrics = useMemo(
    () =>
      activeTimelineGroups.reduce(
        (sum, group) => sum + group.toolCalls.filter((toolCall) => toolCall.status === "completed" || toolCall.status === "error").length,
        0,
      ),
    [activeTimelineGroups],
  );
  const pendingToolCalls = useMemo(() => getPendingUserDecisionToolCalls(activeTimelineGroups), [activeTimelineGroups]);

  const postToolCallAction = useCallback(
    (toolCallId: string, action: ToolCallAction, options: ToolCallActionOptions = {}) => {
      setToolCallGroups((previous) => markToolCallDecision(previous, toolCallId, action));
      vscode?.postMessage({ type: "executeToolCall", toolCallId, action, trustForSession: options.trustForSession });
    },
    [vscode],
  );

  const handleExecute = useCallback(
    (toolCallId: string, options?: ToolCallActionOptions) => postToolCallAction(toolCallId, "execute", options),
    [postToolCallAction],
  );
  const handleReject = useCallback((toolCallId: string) => postToolCallAction(toolCallId, "reject"), [postToolCallAction]);
  const handleExecuteAll = useCallback(() => {
    getPendingToolCalls(toolCallGroups).forEach((toolCall) => postToolCallAction(toolCall.toolCallId, "execute"));
  }, [postToolCallAction, toolCallGroups]);
  const handleRejectAll = useCallback(() => {
    getPendingToolCalls(toolCallGroups).forEach((toolCall) => postToolCallAction(toolCall.toolCallId, "reject"));
  }, [postToolCallAction, toolCallGroups]);

  return {
    dispatcher,
    activeTimelineGroups,
    pendingToolCalls,
    currentRound: toolCallGroups.length > 0 ? toolCallGroups.length : undefined,
    timelineMetrics,
    handleExecute,
    handleReject,
    handleExecuteAll,
    handleRejectAll,
    isProcessing,
  };
}

interface CreateToolCallGroupOptions {
  toolCalls: ToolCall[];
  round: number;
  status: "running" | "pending";
  requiresConfirmation?: boolean;
  dangerConfirmation?: Parameters<NonNullable<MessageDispatcher["onToolCallConfirmationRequired"]>>[0]["dangerConfirmation"];
}

function createToolCallGroup(options: CreateToolCallGroupOptions): ToolCallGroup {
  const { toolCalls, round, status, requiresConfirmation = false, dangerConfirmation } = options;

  return {
    id: `tool-round-${round}`,
    round,
    expanded: true,
    toolCalls: toolCalls.map((toolCall) => ({
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      arguments: toolCall.function.arguments,
      status,
      round,
      requiresConfirmation,
      ...(dangerConfirmation ? { dangerConfirmation } : {}),
    })),
  };
}

function upsertToolCallGroup(groups: ToolCallGroup[], newGroup: ToolCallGroup): ToolCallGroup[] {
  const existingIndex = groups.findIndex((group) => group.round === newGroup.round);
  if (existingIndex < 0) {return [...groups, newGroup];}

  const updated = [...groups];
  updated[existingIndex] = newGroup;
  return updated;
}

function mergeConfirmationGroup(groups: ToolCallGroup[], newGroup: ToolCallGroup): ToolCallGroup[] {
  const existingIndex = groups.findIndex((group) => group.round === newGroup.round);
  if (existingIndex < 0) {return [...groups, newGroup];}

  const updated = [...groups];
  const existingGroup = updated[existingIndex];
  updated[existingIndex] = {
    ...existingGroup,
    toolCalls: existingGroup.toolCalls.map((existingToolCall) => {
      const nextToolCall = newGroup.toolCalls.find((toolCall) => toolCall.toolCallId === existingToolCall.toolCallId);
      return nextToolCall ? { ...existingToolCall, ...nextToolCall } : existingToolCall;
    }),
  };
  return updated;
}

function getVisibleActiveGroups(messages: ChatMessage[], activeGroups: ToolCallGroup[]): ToolCallGroup[] {
  const storedToolCallIds = new Set(messages.flatMap((message) => message.toolCalls?.map((toolCall) => toolCall.toolCallId) ?? []));

  return activeGroups
    .map((group) => ({
      ...group,
      toolCalls: group.toolCalls.filter((toolCall) => !storedToolCallIds.has(toolCall.toolCallId)),
    }))
    .filter((group) => group.toolCalls.length > 0);
}

function getPendingToolCalls(groups: ToolCallGroup[]) {
  return groups
    .flatMap((group) => group.toolCalls)
    .filter((toolCall) => toolCall.requiresConfirmation && toolCall.status === "pending" && !toolCall.dangerConfirmation);
}

function getPendingUserDecisionToolCalls(groups: ToolCallGroup[]): ToolCallState[] {
  return groups
    .flatMap((group) => group.toolCalls)
    .filter((toolCall) => toolCall.status === "pending" && (toolCall.requiresConfirmation || toolCall.dangerConfirmation));
}

function markToolCallDecision(groups: ToolCallGroup[], toolCallId: string, action: ToolCallAction): ToolCallGroup[] {
  return groups.map((group) => ({
    ...group,
    toolCalls: group.toolCalls.map((toolCall) =>
      toolCall.toolCallId === toolCallId
        ? {
            ...toolCall,
            status: action === "execute" ? ("running" as const) : ("rejected" as const),
            requiresConfirmation: false,
            dangerConfirmation: undefined,
            rejected: action === "reject",
          }
        : toolCall,
    ),
  }));
}
