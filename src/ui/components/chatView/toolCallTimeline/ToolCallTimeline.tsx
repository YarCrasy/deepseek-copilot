import type { VsCodeApi } from "@webview/VsCodeApi";
import type { ToolCallGroup, ToolCallState } from "@webview/views/chatView/ChatViewTypes";
import CollapsiblePanel from "../../shared/collapsiblePanel/CollapsiblePanel";
import { renderToolCallResultPreview } from "../toolCallResultPreview/ToolCallResultPreview";
import { renderToolCallArgumentsPreview } from "../toolCallResultPreview/ToolCallResultRenderers";
import "../toolCallResultPreview/ToolCallResultPreview.css";
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
    <CollapsiblePanel
      title={<span className="toolCallName">{toolCall.toolName}</span>}
      meta={<span className={`toolCallStatus ${toolCall.status}`}>{formatStatus(toolCall.status)}</span>}
      className={`toolCallItem ${toolCall.status}`}
      bodyClassName="toolCallItemBody"
    >
      {toolCall.arguments ? <div className="toolCallArgs">{renderToolCallArgumentsPreview(toolCall.toolName, toolCall.arguments)}</div> : null}
      {renderToolCallResultPreview({ toolCall, vscode })}
    </CollapsiblePanel>
  );
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

export default ToolCallTimeline;
