import { useCallback, useEffect, useRef, useState } from "react";
import { useVsCode } from "../contexts";
import { MODEL_OPTIONS } from "@/adapters/deepseek/Models";
import type { PermissionMode } from "@/adapters";

/**
 * Converts the UI reasoning value to the config expected by the extension host.
 */
function reasoningToConfig(value: string): { thinkingMode: boolean; reasoningEffort?: "high" | "max" } {
  const thinkingMode = value !== "off";
  if (!thinkingMode) {
    return { thinkingMode };
  }
  const reasoningEffort = value === "max" ? ("max" as const) : ("high" as const);
  return { thinkingMode, reasoningEffort };
}

export function useChatConfig() {
  const vscode = useVsCode();

  const provider = "deepseek";
  const [reasoning, setReasoning] = useState<string>("high");
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0]?.value ?? "");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("read-only");

  const selectedModelRef = useRef(selectedModel);
  const reasoningRef = useRef(reasoning);
  const providerRef = useRef(provider);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);
  useEffect(() => {
    reasoningRef.current = reasoning;
  }, [reasoning]);
  /**
   * Applies saved config from configLoaded without side effects inside useEffect.
   */
  const applySavedConfig = useCallback((config: { reasoning?: string; model?: string; permissionMode?: PermissionMode }) => {
    if (config.reasoning !== undefined) {
      setReasoning(config.reasoning);
      reasoningRef.current = config.reasoning;
    }
    if (config.model !== undefined) {
      setSelectedModel(config.model);
      selectedModelRef.current = config.model;
    }
    if (config.permissionMode !== undefined) {
      setPermissionMode(config.permissionMode);
    }
  }, []);

  const handleReasoningChange = useCallback(
    (value: string) => {
      setReasoning(value);
      reasoningRef.current = value;
      const configUpdate = reasoningToConfig(value);
      vscode?.postMessage({ type: "saveConfig", config: configUpdate });
    },
    [vscode],
  );

  const handleModelChange = useCallback(
    (modelId: string) => {
      setSelectedModel(modelId);
      selectedModelRef.current = modelId;
      vscode?.postMessage({ type: "selectModel", modelId });
      vscode?.postMessage({ type: "saveConfig", config: { model: modelId } });
    },
    [vscode],
  );

  const handlePermissionModeChange = useCallback(
    (value: PermissionMode) => {
      setPermissionMode(value);
      vscode?.postMessage({ type: "saveConfig", config: { permissionMode: value } });
    },
    [vscode],
  );

  return {
    provider,
    selectedModel,
    reasoning,
    permissionMode,
    selectedModelRef,
    reasoningRef,
    providerRef,
    applySavedConfig,
    handleReasoningChange,
    handleModelChange,
    handlePermissionModeChange,
  };
}
