import type { ToolCallActionOptions, ToolCallState } from "@webview/views/chatView/ChatViewTypes";
import DangerConfirmation from "../toolCallDangerConfirmation/ToolCallDangerConfirmation";
import { renderToolCallArgumentsPreview } from "../toolCallResultPreview/ToolCallResultRenderers";
import "../toolCallResultPreview/ToolCallResultPreview.css";
import "./ToolCallConfirmationModal.css";

interface ToolCallConfirmationModalProps {
  pendingToolCalls: ToolCallState[];
  onExecute: (toolCallId: string, options?: ToolCallActionOptions) => void;
  onReject: (toolCallId: string) => void;
  onExecuteAll: () => void;
  onRejectAll: () => void;
}

function ToolCallConfirmationModal({ pendingToolCalls, onExecute, onReject, onExecuteAll, onRejectAll }: ToolCallConfirmationModalProps) {
  if (pendingToolCalls.length === 0) {
    return null;
  }

  const activeToolCall = pendingToolCalls[0];
  const manualBatchCount = pendingToolCalls.filter((toolCall) => toolCall.requiresConfirmation && !toolCall.dangerConfirmation).length;
  const filePath = activeToolCall.dangerConfirmation?.filePath ?? getArgumentValue(activeToolCall.arguments, "path");
  const dangerTitle = getDangerTitle(activeToolCall.dangerConfirmation?.dangerLevel);
  const title = `${dangerTitle}: ${activeToolCall.dangerConfirmation?.warningMessage}`;
  const subtitle = filePath ? `File: ${filePath}` : "Review before executing.";

  return (
    <div className="toolCallModalBackdrop" role="presentation">
      <section className="toolCallModal" role="dialog" aria-modal="true" aria-labelledby={activeToolCall.dangerConfirmation ? "tool-call-modal-title" : undefined}>
        {activeToolCall.dangerConfirmation ? (
          <header className="toolCallModalHeader">
            <div>
              <h3 id="tool-call-modal-title">{title}</h3>
              <p>{subtitle}</p>
            </div>
            <span className={`toolCallStatus ${activeToolCall.status}`}>{activeToolCall.status}</span>
          </header>
        ) : null}

        {activeToolCall.arguments ? (
          <details className="toolCallModalDetails">
            <summary>
              <span>Review details</span>
              <span>{activeToolCall.toolName}</span>
              <span>Round {activeToolCall.round}</span>
            </summary>
            <div className="toolCallModalArgs">{renderToolCallArgumentsPreview(activeToolCall.toolName, activeToolCall.arguments)}</div>
          </details>
        ) : null}

        {activeToolCall.dangerConfirmation ? (
          <DangerConfirmation
            toolCallId={activeToolCall.toolCallId}
            dangerConfirmation={activeToolCall.dangerConfirmation}
            onConfirm={onExecute}
            onCancel={onReject}
          />
        ) : (
          <div className="toolCallDecisionRow">
            <button type="button" className="toolCallDecisionOption primary" onClick={() => onExecute(activeToolCall.toolCallId)}>
              Execute
            </button>
            <button type="button" className="toolCallDecisionOption" onClick={() => onReject(activeToolCall.toolCallId)}>
              Reject
            </button>
          </div>
        )}

        {manualBatchCount > 1 ? (
          <div className="toolCallModalBatchActions">
            <button type="button" className="toolCallActionBtn" onClick={onExecuteAll}>
              Execute all manual tools
            </button>
            <button type="button" className="toolCallActionBtn secondary" onClick={onRejectAll}>
              Reject all manual tools
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function getArgumentValue(argumentsJson: string | undefined, key: string): string | undefined {
  if (!argumentsJson) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(argumentsJson) as Record<string, unknown>;
    const value = parsed[key];
    return typeof value === "string" && value.trim() ? value : undefined;
  } catch {
    return undefined;
  }
}

function getDangerTitle(dangerLevel: string | undefined): string {
  if (dangerLevel === "destructive") {
    return "Destructive Action";
  }
  if (dangerLevel === "dangerous") {
    return "Potentially Dangerous Action";
  }
  return "Caution Required";
}

export default ToolCallConfirmationModal;
