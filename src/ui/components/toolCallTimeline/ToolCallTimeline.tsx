import type { VsCodeApi } from "@webview/VsCodeApi";
import type { ToolCallGroup, ToolCallState } from "../../views/chatView/ChatViewTypes";
import { renderToolCallResultPreview } from "../toolCallResultPreview/ToolCallResultPreview";
import "./ToolCallTimeline.css";

interface ToolCallTimelineProps {
  groups: ToolCallGroup[];
  vscode: VsCodeApi | null;
}

function ToolCallTimeline({ groups, vscode }: ToolCallTimelineProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="toolCallTimeline" aria-label="Tool calls">
      {groups.map((group) => (
        <div className="toolCallGroup" key={group.id}>
          <div className="toolCallRound">Round {group.round}</div>
          {group.toolCalls.map((toolCall) => (
            <ToolCallItem key={toolCall.toolCallId} toolCall={toolCall} vscode={vscode} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ToolCallItemProps {
  toolCall: ToolCallState;
  vscode: VsCodeApi | null;
}

function ToolCallItem({ toolCall, vscode }: ToolCallItemProps) {
  return (
    <details className={`toolCallItem ${toolCall.status}`} open={shouldOpenToolCall(toolCall)}>
      <summary className="toolCallItemSummary">
        <div className="toolCallNameBlock">
          <span className="toolCallName">{toolCall.toolName}</span>
          <span className={`toolCallStatus ${toolCall.status}`}>{formatStatus(toolCall.status)}</span>
        </div>
      </summary>

      <div className="toolCallItemBody">
        {toolCall.arguments ? (
          <pre className="toolCallArgs">
            <code>{formatArguments(toolCall.arguments)}</code>
          </pre>
        ) : null}

        {renderToolCallResultPreview({ toolCall, vscode })}
      </div>
    </details>
  );
}

function shouldOpenToolCall(toolCall: ToolCallState): boolean {
  return toolCall.status === "running" || toolCall.status === "error";
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
