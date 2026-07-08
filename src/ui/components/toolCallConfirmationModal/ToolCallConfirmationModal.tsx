import type { ToolCallActionOptions, ToolCallState } from "../../views/chatView/ChatViewTypes";
import DangerConfirmation from "../toolCallDangerConfirmation/ToolCallDangerConfirmation";
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
  const title = activeToolCall.dangerConfirmation ? `${dangerTitle}: ${activeToolCall.dangerConfirmation.warningMessage}` : "Tool confirmation";
  const subtitle = activeToolCall.dangerConfirmation
    ? filePath
      ? `File: ${filePath}`
      : "Review before executing."
    : pendingToolCalls.length === 1
      ? "Waiting for your decision."
      : `${pendingToolCalls.length} tools are waiting.`;

  return (
    <div className="toolCallModalBackdrop" role="presentation">
      <section className="toolCallModal" role="dialog" aria-modal="true" aria-labelledby="tool-call-modal-title">
        <header className="toolCallModalHeader">
          <div>
            <h3 id="tool-call-modal-title">{title}</h3>
            <p>{subtitle}</p>
          </div>
          <span className={`toolCallStatus ${activeToolCall.status}`}>{activeToolCall.status}</span>
        </header>

        {activeToolCall.arguments ? (
          <details className="toolCallModalDetails">
            <summary>
              <span>Review details</span>
              <span>{activeToolCall.toolName}</span>
              <span>Round {activeToolCall.round}</span>
            </summary>
            <pre className="toolCallArgs toolCallModalArgs">
              <code>{formatArguments(activeToolCall.arguments)}</code>
            </pre>
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
          <div className="toolCallDecisionList">
            <button type="button" className="toolCallDecisionOption primary" onClick={() => onExecute(activeToolCall.toolCallId)}>
              <span>1</span>
              Execute
            </button>
            <button type="button" className="toolCallDecisionOption" onClick={() => onReject(activeToolCall.toolCallId)}>
              <span>2</span>
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

function formatArguments(argumentsJson: string): string {
  try {
    return JSON.stringify(JSON.parse(argumentsJson), null, 2);
  } catch {
    return argumentsJson;
  }
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
