import { useMemo } from "react";
import "./InputFooter.css";
import { MODEL_OPTIONS } from "@/adapters/deepseek/models";
import ReferencedFilesChips from "./ReferencedFilesChips";
import type { ReferencedFile } from "./types";

type Props = {
  reasoning: string;
  selectedModel: string;
  onReasoningChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  /** Files referenced in the next chat request. */
  referencedFiles?: ReferencedFile[];
  /** Remove a referenced file. */
  onRemoveReferencedFile?: (index: number) => void;
};

function InputFooter({
  reasoning,
  selectedModel,
  onReasoningChange,
  onModelChange,
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

  return (
    <div className="inputFooter">
      <ReferencedFilesChips files={referencedFiles} onRemove={onRemoveReferencedFile ?? (() => undefined)} />
      <div className="inputFooterControls">
        <span className="selectTooltipWrapper" data-tooltip="Model Selector">
          <select name="ModelSelector" id="ModelSelector" aria-label="Model Selector" value={selectedModel} onChange={(event) => onModelChange(event.target.value)}>
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          </select>
        </span>
        <span className="selectTooltipWrapper" data-tooltip="Reasoning">
          <select name="Reasoning" id="Reasoning" aria-label="Reasoning" value={reasoning} onChange={(event) => onReasoningChange(event.target.value)}>
          {reasoningOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          </select>
        </span>
      </div>
    </div>
  );
}

export default InputFooter;
