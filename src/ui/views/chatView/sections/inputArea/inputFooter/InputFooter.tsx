import { useMemo } from "react";
import "./InputFooter.css";
import { MODEL_OPTIONS } from "@/adapters/deepseek/Models";
import ReferencedFilesChips from "./ReferencedFilesChips";
import type { ReferencedFile } from "./Types";
import type { PermissionMode } from "@/adapters";
import { t } from "@webview/i18n";

type Props = {
  reasoning: string;
  selectedModel: string;
  permissionMode: PermissionMode;
  onReasoningChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onPermissionModeChange: (value: PermissionMode) => void;
  /** Files referenced in the next chat request. */
  referencedFiles?: ReferencedFile[];
  /** Remove a referenced file. */
  onRemoveReferencedFile?: (index: number) => void;
};

const PERMISSION_MODES: readonly PermissionMode[] = ["chat", "read-only", "workspace", "full-access"];

function parsePermissionMode(value: string): PermissionMode | undefined {
  return PERMISSION_MODES.find((mode) => mode === value);
}

function InputFooter({
  reasoning,
  selectedModel,
  permissionMode,
  onReasoningChange,
  onModelChange,
  onPermissionModeChange,
  referencedFiles = [],
  onRemoveReferencedFile,
}: Props) {
  const reasoningOptions = useMemo(() => {
    return [{ value: "off", label: t("Off") }, { value: "high", label: t("High") }, { value: "max", label: t("Max") }];
  }, []);

  const modelOptions = useMemo(() => {
    if (!selectedModel || MODEL_OPTIONS.some((option) => option.value === selectedModel)) {
      return MODEL_OPTIONS;
    }
    return [...MODEL_OPTIONS, { value: selectedModel, label: selectedModel }];
  }, [selectedModel]);

  const permissionOptions: Array<{ value: PermissionMode; label: string }> = [
    { value: "chat", label: t("Chat") },
    { value: "read-only", label: t("Read only") },
    { value: "workspace", label: t("Workspace") },
    { value: "full-access", label: t("Full access") },
  ];

  return (
    <div className="inputFooter">
      <ReferencedFilesChips files={referencedFiles} onRemove={onRemoveReferencedFile ?? (() => undefined)} />
      <div className="inputFooterControls">
        <div className="inputFooterPrimaryControls">
          <span className="selectTooltipWrapper" data-tooltip={t("Model Selector")}>
            <select name="ModelSelector" id="ModelSelector" aria-label={t("Model Selector")} value={selectedModel} onChange={(event) => onModelChange(event.target.value)}>
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
          </span>
          <span className="selectTooltipWrapper" data-tooltip={t("Reasoning")}>
            <select name="Reasoning" id="Reasoning" aria-label={t("Reasoning")} value={reasoning} onChange={(event) => onReasoningChange(event.target.value)}>
            {reasoningOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
          </span>
        </div>
        <span className="selectTooltipWrapper" data-tooltip={t("Permission mode")}>
          <select
            name="PermissionMode"
            id="PermissionMode"
            aria-label={t("Permission mode")}
            value={permissionMode}
            onChange={(event) => {
              const nextPermissionMode = parsePermissionMode(event.target.value);
              if (nextPermissionMode) {
                onPermissionModeChange(nextPermissionMode);
              }
            }}
          >
            {permissionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}

export default InputFooter;
