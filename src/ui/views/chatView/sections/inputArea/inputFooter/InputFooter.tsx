import { useMemo } from "react";
import "./InputFooter.css";
import { MODEL_OPTIONS } from "@/adapters/deepseek/Models";
import ReferencedFilesChips from "./ReferencedFilesChips";
import type { ReferencedFile } from "./Types";
import type { PermissionMode } from "@/adapters";

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
    return [{ value: "off", label: "Off" }, { value: "high", label: "High" }, { value: "max", label: "Max" }];
  }, []);

  const modelOptions = useMemo(() => {
    if (!selectedModel || MODEL_OPTIONS.some((option) => option.value === selectedModel)) {
      return MODEL_OPTIONS;
    }
    return [...MODEL_OPTIONS, { value: selectedModel, label: selectedModel }];
  }, [selectedModel]);

  const permissionOptions: Array<{ value: PermissionMode; label: string }> = [
    { value: "chat", label: "Chat" },
    { value: "read-only", label: "Read only" },
    { value: "workspace", label: "Workspace" },
    { value: "full-access", label: "Full access" },
  ];

  return (
    <div className="inputFooter">
      <ReferencedFilesChips files={referencedFiles} onRemove={onRemoveReferencedFile ?? (() => undefined)} />
      <div className="inputFooterControls">
        <div className="inputFooterPrimaryControls">
          <span className="selectTooltipWrapper" data-tooltip="Model Selector">
            <select name="ModelSelector" id="ModelSelector" aria-label="Model Selector" value={selectedModel} onChange={(event) => onModelChange(event.target.value)}>
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
          </span>
          <span className="selectTooltipWrapper" data-tooltip="Reasoning">
            <select name="Reasoning" id="Reasoning" aria-label="Reasoning" value={reasoning} onChange={(event) => onReasoningChange(event.target.value)}>
            {reasoningOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
          </span>
        </div>
        <span className="selectTooltipWrapper" data-tooltip="Permission mode">
          <select name="PermissionMode" id="PermissionMode" aria-label="Permission mode" value={permissionMode} onChange={(event) => onPermissionModeChange(event.target.value as PermissionMode)}>
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
