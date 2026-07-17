import type { DangerConfirmationData } from "@webview/views/chatView/ChatViewTypes";
import "./ToolCallDangerConfirmation.css";
import { t } from "@webview/i18n";

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
        <pre className="dangerCommandPreview" tabIndex={0} aria-label={t("Complete command")}>
          <code>{dangerConfirmation.command}</code>
        </pre>
      )}
      {dangerConfirmation.cwd ? <div className="dangerExecutionContext"><strong>{t("Working directory:")}</strong> <code>{dangerConfirmation.cwd}</code></div> : null}
      {dangerConfirmation.shell ? <div className="dangerExecutionContext"><strong>{t("Shell:")}</strong> <code>{dangerConfirmation.shell}</code></div> : null}

      <p className="dangerTrustExplanation">
        {isDestructive
          ? t("This destructive operation is approved once only. Destructive actions always require a separate confirmation.")
          : t("Execute once approves only this operation. Trust for this session approves matching safe operations until this VS Code session ends.")}
      </p>

      <div className="toolCallDecisionRow">
        <button
          type="button"
          className="toolCallDecisionOption primary dangerPrimaryAction dangerConfirmBtn"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm(toolCallId, { trustForSession: false });
          }}
        >
          {isDestructive ? t("Yes, execute once") : t("Execute once")}
        </button>
        {canTrustForSession && (
          <button
            type="button"
            className="toolCallDecisionOption dangerPrimaryAction dangerRememberBtn"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm(toolCallId, { trustForSession: true });
            }}
          >
            {t("Trust matching operations this session")}
          </button>
        )}
        <button
          type="button"
          className="toolCallDecisionOption dangerCancelBtn"
          data-dialog-initial-focus
          onClick={(event) => {
            event.stopPropagation();
            onCancel(toolCallId);
          }}
        >
          {t("Cancel")}
        </button>
      </div>
    </div>
  );
}

export default DangerConfirmation;
