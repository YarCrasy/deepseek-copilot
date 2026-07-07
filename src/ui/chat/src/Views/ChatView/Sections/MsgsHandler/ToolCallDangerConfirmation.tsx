import { useState } from "react";
import type { DangerConfirmationData } from "../../ChatViewTypes";

interface DangerConfirmationProps {
  toolCallId: string;
  dangerConfirmation: DangerConfirmationData;
  onConfirm: (toolCallId: string, options?: { trustForSession?: boolean }) => void;
  onCancel: (toolCallId: string) => void;
}

function DangerConfirmation({ toolCallId, dangerConfirmation, onConfirm, onCancel }: DangerConfirmationProps) {
  const [trustForSession, setTrustForSession] = useState(false);
  const dangerLevel = dangerConfirmation.dangerLevel;
  const severityClass = dangerLevel === "destructive" ? "severityDestructive" : dangerLevel === "dangerous" ? "severityDangerous" : "severityCaution";
  const isDestructive = dangerLevel === "destructive";
  const isDangerous = dangerLevel === "dangerous" || dangerLevel === "destructive";
  const canTrustForSession = dangerConfirmation.canTrustForSession !== false && !isDestructive;

  return (
    <div className={`dangerConfirmation ${severityClass}`}>
      <div className="dangerConfirmationHeader">
        <span className="dangerIcon">{isDestructive ? "🚨" : isDangerous ? "⚠️" : "⚡"}</span>
        <span className="dangerTitle">{isDestructive ? "Destructive Action" : isDangerous ? "Potentially Dangerous Action" : "Caution Required"}</span>
      </div>

      <div className="dangerConfirmationBody">
        <p className="dangerWarning">{dangerConfirmation.warningMessage}</p>
        {dangerConfirmation.command && (
          <div className="dangerCommandPreview">
            <code>{dangerConfirmation.command}</code>
          </div>
        )}
        {dangerConfirmation.filePath && (
          <div className="dangerFilePath">
            File: <code>{dangerConfirmation.filePath}</code>
          </div>
        )}
      </div>

      {canTrustForSession && (
        <label className="dangerTrustOption" onClick={(event) => event.stopPropagation()}>
          <input type="checkbox" checked={trustForSession} onChange={(event) => setTrustForSession(event.target.checked)} />
          <span>Trust this tool and danger level for this session</span>
        </label>
      )}

      <div className="dangerConfirmationActions">
        <button
          className="toolCallActionBtn dangerConfirmBtn"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm(toolCallId, { trustForSession: canTrustForSession && trustForSession });
          }}
        >
          {isDestructive ? "Yes, I understand — Execute" : "Execute Anyway"}
        </button>
        <button
          className="toolCallActionBtn dangerCancelBtn"
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
