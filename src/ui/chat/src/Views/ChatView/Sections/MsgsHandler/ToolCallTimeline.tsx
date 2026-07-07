import type { VsCodeApi } from "@webview/vscodeApi";
import type { ToolCallActionOptions, ToolCallGroup, ToolCallState } from "../../ChatViewTypes";
import DangerConfirmation from "./ToolCallDangerConfirmation";
import { renderToolCallResultPreview } from "./ToolCallResultPreview";

interface ToolCallTimelineProps {
  groups: ToolCallGroup[];
  vscode: VsCodeApi | null;
  onExecute: (toolCallId: string, options?: ToolCallActionOptions) => void;
  onReject: (toolCallId: string) => void;
  onExecuteAll: () => void;
  onRejectAll: () => void;
}

function ToolCallTimeline({ groups, vscode, onExecute, onReject, onExecuteAll, onRejectAll }: ToolCallTimelineProps) {
  if (groups.length === 0) {
    return null;
  }

  const pendingCount = groups.reduce((total, group) => total + group.toolCalls.filter(isManualPendingToolCall).length, 0);

  return (
    <details className="toolCallTimeline" aria-label="Tool calls" open={pendingCount > 0}>
      <summary className="toolCallTimelineHeader">
        <span>Tool calls</span>
        {pendingCount > 1 ? (
          <div className="toolCallBatchActions">
            <button type="button" className="toolCallActionBtn" onClick={(event) => {
              event.preventDefault();
              onExecuteAll();
            }}>
              Execute all
            </button>
            <button type="button" className="toolCallActionBtn secondary" onClick={(event) => {
              event.preventDefault();
              onRejectAll();
            }}>
              Reject all
            </button>
          </div>
        ) : null}
      </summary>

      {groups.map((group) => (
        <details className="toolCallGroup" key={group.id} open={shouldOpenToolCallGroup(group)}>
          <summary className="toolCallRound">Round {group.round}</summary>
          {group.toolCalls.map((toolCall) => (
            <ToolCallItem key={toolCall.toolCallId} toolCall={toolCall} vscode={vscode} onExecute={onExecute} onReject={onReject} />
          ))}
        </details>
      ))}
    </details>
  );
}

interface ToolCallItemProps {
  toolCall: ToolCallState;
  vscode: VsCodeApi | null;
  onExecute: (toolCallId: string, options?: ToolCallActionOptions) => void;
  onReject: (toolCallId: string) => void;
}

function ToolCallItem({ toolCall, vscode, onExecute, onReject }: ToolCallItemProps) {
  const pending = isManualPendingToolCall(toolCall);

  return (
    <details className={`toolCallItem ${toolCall.status}`} open={shouldOpenToolCall(toolCall)}>
      <summary className="toolCallItemSummary">
        <div className="toolCallNameBlock">
          <span className="toolCallName">{toolCall.toolName}</span>
          <span className={`toolCallStatus ${toolCall.status}`}>{formatStatus(toolCall.status)}</span>
        </div>
      </summary>

      <div className="toolCallItemBody">
        {pending ? (
          <div className="toolCallActions">
            <button type="button" className="toolCallActionBtn" onClick={() => onExecute(toolCall.toolCallId)}>
              Execute
            </button>
            <button type="button" className="toolCallActionBtn secondary" onClick={() => onReject(toolCall.toolCallId)}>
              Reject
            </button>
          </div>
        ) : null}

        {toolCall.arguments ? (
          <pre className="toolCallArgs">
            <code>{formatArguments(toolCall.arguments)}</code>
          </pre>
        ) : null}

        {toolCall.dangerConfirmation ? (
          <DangerConfirmation
            toolCallId={toolCall.toolCallId}
            dangerConfirmation={toolCall.dangerConfirmation}
            onConfirm={onExecute}
            onCancel={onReject}
          />
        ) : null}

        {renderToolCallResultPreview({ toolCall, vscode })}
      </div>
    </details>
  );
}

function isManualPendingToolCall(toolCall: ToolCallState): boolean {
  return toolCall.requiresConfirmation === true && toolCall.status === "pending" && !toolCall.dangerConfirmation;
}

function shouldOpenToolCall(toolCall: ToolCallState): boolean {
  return toolCall.status === "pending" || toolCall.status === "running" || toolCall.status === "error" || Boolean(toolCall.dangerConfirmation);
}

function shouldOpenToolCallGroup(group: ToolCallGroup): boolean {
  return group.toolCalls.some(shouldOpenToolCall);
}

function formatStatus(status: ToolCallState["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "error":
      return "Error";
    case "rejected":
      return "Rejected";
  }
}

function formatArguments(argumentsJson: string): string {
  try {
    return JSON.stringify(JSON.parse(argumentsJson), null, 2);
  } catch {
    return argumentsJson;
  }
}

export default ToolCallTimeline;
