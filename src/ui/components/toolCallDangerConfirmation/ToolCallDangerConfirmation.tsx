import type { DangerConfirmationData } from "../../views/chatView/ChatViewTypes";
import "./ToolCallDangerConfirmation.css";

interface DangerConfirmationProps {
  toolCallId: string;
  dangerConfirmation: DangerConfirmationData;
  onConfirm: (toolCallId: string, options?: { trustForSession?: boolean }) => void;
  onCancel: (toolCallId: string) => void;
}

function DangerConfirmation({ toolCallId, dangerConfirmation, onConfirm, onCancel }: DangerConfirmationProps) {
  const dangerLevel = dangerConfirmation.dangerLevel;
  const severityClass = dangerLevel === "destructive" ? "severityDestructive" : dangerLevel === "dangerous" ? "severityDangerous" : "severityCaution";
  const isDestructive = dangerLevel === "destructive";
  const canTrustForSession = dangerConfirmation.canTrustForSession !== false && !isDestructive;

  return (
    <div className={`dangerConfirmation ${severityClass}`}>
      {dangerConfirmation.command && (
        <div className="dangerCommandPreview">
          <code>{dangerConfirmation.command}</code>
        </div>
      )}

      <div className="toolCallDecisionRow">
        <button
          className="toolCallDecisionOption primary dangerPrimaryAction dangerConfirmBtn"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm(toolCallId, { trustForSession: false });
          }}
        >
          {isDestructive ? "Yes, execute" : "Execute"}
        </button>
        {canTrustForSession && (
          <button
            className="toolCallDecisionOption dangerPrimaryAction dangerRememberBtn"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm(toolCallId, { trustForSession: true });
            }}
          >
            Remember for this session
          </button>
        )}
        <button
          className="toolCallDecisionOption dangerCancelBtn"
          onClick={(event) => {
            event.stopPropagation();
            onCancel(toolCallId);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DangerConfirmation;
