import { useState } from "react";
import type { VsCodeApi } from "@webview/VsCodeApi";
import type { ToolCallGroup, ToolCallState } from "@webview/views/chatView/ChatViewTypes";
import CollapsiblePanel from "../../shared/collapsiblePanel/CollapsiblePanel";
import { renderToolCallResultPreview } from "../toolCallResultPreview/ToolCallResultPreview";
import { renderToolCallArgumentsPreview } from "../toolCallResultPreview/ToolCallResultRenderers";
import "../toolCallResultPreview/ToolCallResultPreview.css";
import "./ToolCallTimeline.css";
import { t } from "@webview/i18n";

interface ToolCallTimelineProps {
  groups: ToolCallGroup[];
  vscode: VsCodeApi | null;
}

function ToolCallTimeline({ groups, vscode }: ToolCallTimelineProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="toolCallTimeline" aria-label={t("tools.toolCalls")}>
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
  const [copyStatus, setCopyStatus] = useState("");

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      vscode?.postMessage({ type: "copyCode", code: value });
    }
    setCopyStatus(t("tools.labelCopied", { label }));
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  return (
    <CollapsiblePanel
      title={<span className="toolCallName">{toolCall.toolName}</span>}
      meta={<span className={`toolCallStatus ${toolCall.status}`} role="status" aria-live="polite">{formatStatus(toolCall.status)}</span>}
      className={`toolCallItem ${toolCall.status}`}
      bodyClassName="toolCallItemBody"
    >
      <div className="toolCallCopyActions" aria-label={t("tools.copyToolData", { tool: toolCall.toolName })}>
        <button type="button" onClick={() => void copy(t("tools.toolCall"), formatToolCallForCopy(toolCall))}>{t("tools.copyCall")}</button>
        {toolCall.arguments ? <button type="button" onClick={() => void copy(t("tools.copyArguments"), toolCall.arguments)}>{t("tools.copyArguments")}</button> : null}
        {toolCall.result ? <button type="button" onClick={() => void copy(t("results.result"), toolCall.result ?? "")}>{t("tools.copyResult")}</button> : null}
      </div>
      <span className="srOnly" role="status" aria-live="polite">{copyStatus}</span>
      {toolCall.arguments ? <div className="toolCallArgs">{renderToolCallArgumentsPreview(toolCall.toolName, toolCall.arguments)}</div> : null}
      {renderToolCallResultPreview({ toolCall, vscode })}
    </CollapsiblePanel>
  );
}

function formatStatus(status: ToolCallState["status"]): string {
  switch (status) {
    case "pending":
      return t("tools.pending");
    case "awaiting_confirmation":
      return t("tools.awaitingConfirmation");
    case "running":
      return t("tools.running");
    case "completed":
      return t("tools.completed");
    case "error":
      return t("tools.error");
    case "rejected":
      return t("tools.rejected");
    case "cancelled":
      return t("tools.cancelled");
  }
}

function formatToolCallForCopy(toolCall: ToolCallState): string {
  let args: unknown = toolCall.arguments;
  try {
    args = JSON.parse(toolCall.arguments) as unknown;
  } catch {
    // Preserve malformed arguments exactly as received.
  }
  return JSON.stringify({ name: toolCall.toolName, arguments: args }, null, 2);
}

export default ToolCallTimeline;
