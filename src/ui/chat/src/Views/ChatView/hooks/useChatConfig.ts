import { useCallback, useEffect, useRef, useState } from "react";
import { useVsCode } from "../contexts";
import { MODEL_OPTIONS } from "@/adapters/models";

/**
 * Convierte un valor UI de razonamiento al par { thinkingMode, reasoningEffort }
 * que espera el handler de la extensión.
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

  // ── Estado sincronizado (UI + refs) ──
  const provider = "deepseek";
  const [reasoning, setReasoning] = useState<string>("high");
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0]?.value ?? "");

  const selectedModelRef = useRef(selectedModel);
  const reasoningRef = useRef(reasoning);
  const providerRef = useRef(provider);

  // Sincronizar refs con el estado actual
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);
  useEffect(() => {
    reasoningRef.current = reasoning;
  }, [reasoning]);
  /**
   * Aplica la configuración guardada (desde `configLoaded`).
   * Se invoca desde el callback `onConfigLoaded` de ChatView,
   * evitando efectos secundarios dentro de useEffect.
   */
  const applySavedConfig = useCallback((config: { reasoning?: string; model?: string }) => {
    if (config.reasoning !== undefined) {
      setReasoning(config.reasoning);
      reasoningRef.current = config.reasoning;
    }
    if (config.model !== undefined) {
      setSelectedModel(config.model);
      selectedModelRef.current = config.model;
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

  return {
    provider,
    selectedModel,
    reasoning,
    selectedModelRef,
    reasoningRef,
    providerRef,
    applySavedConfig,
    handleReasoningChange,
    handleModelChange,
  };
}
