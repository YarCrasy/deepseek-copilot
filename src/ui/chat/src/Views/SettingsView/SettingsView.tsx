import { useCallback, useEffect, useMemo, useState } from "react";
import "@vscode/codicons/dist/codicon.css";
import "./SettingsView.css";
import { ProvidersTab, ToolsTab } from "./tabs";
import { getVsCodeApi } from "../../vscodeApi";
import { DEFAULT_CONFIG, MODEL_OPTIONS, REASONING_EFFORT_OPTIONS, type SettingsConfig } from "./SettingsDataModels";
import type { AvailableToolInfo, HandlerToWebviewMessage, ToolExecutionModes } from "@/adapters";

type SettingsTab = "deepseek" | "tools";

function SettingsView() {
  const vscode = useMemo(() => getVsCodeApi(), []);
  const [config, setConfig] = useState<SettingsConfig>(DEFAULT_CONFIG);
  const [tools, setTools] = useState<AvailableToolInfo[]>([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>("deepseek");
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const effectiveToolExecutionModes = useMemo(() => normalizeToolExecutionModes(config.toolExecutionModes, tools), [config.toolExecutionModes, tools]);

  const applyConfig = useCallback((nextConfig: Partial<SettingsConfig>) => {
    setConfig((current) => ({
      ...current,
      ...nextConfig,
      apiKey: nextConfig.apiKey ?? current.apiKey ?? DEFAULT_CONFIG.apiKey,
      model: nextConfig.model ?? current.model ?? DEFAULT_CONFIG.model,
      thinkingMode: nextConfig.thinkingMode ?? current.thinkingMode ?? DEFAULT_CONFIG.thinkingMode,
      reasoningEffort: nextConfig.reasoningEffort ?? current.reasoningEffort ?? DEFAULT_CONFIG.reasoningEffort,
      temperature: nextConfig.temperature ?? current.temperature ?? DEFAULT_CONFIG.temperature,
      topP: nextConfig.topP ?? current.topP ?? DEFAULT_CONFIG.topP,
      maxTokens: nextConfig.maxTokens ?? current.maxTokens ?? DEFAULT_CONFIG.maxTokens,
      baseUrl: nextConfig.baseUrl ?? current.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      responseFormat: nextConfig.responseFormat ?? current.responseFormat ?? DEFAULT_CONFIG.responseFormat,
      streamResponse: nextConfig.streamResponse ?? current.streamResponse ?? DEFAULT_CONFIG.streamResponse,
      toolExecutionModes: nextConfig.toolExecutionModes ?? current.toolExecutionModes ?? DEFAULT_CONFIG.toolExecutionModes,
    }));
  }, []);

  const updateConfig = useCallback(<K extends keyof SettingsConfig>(key: K, value: SettingsConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  }, []);

  const saveOnBlur = useCallback(
    <K extends keyof SettingsConfig>(key: K, value: SettingsConfig[K]) => {
      if (vscode) {
        vscode.postMessage({
          type: "saveConfig",
          config: { [key]: value } as Partial<SettingsConfig>,
        });
      }
    },
    [vscode],
  );

  const updateConfigSimple = useCallback(
    (key: string, value: unknown) => {
      updateConfig(key as keyof SettingsConfig, value as SettingsConfig[keyof SettingsConfig]);
    },
    [updateConfig],
  );

  const saveOnBlurSimple = useCallback(
    (key: string, value: unknown) => {
      saveOnBlur(key as keyof SettingsConfig, value as SettingsConfig[keyof SettingsConfig]);
    },
    [saveOnBlur],
  );

  const handleReset = useCallback(() => {
    vscode?.postMessage({ type: "resetConfig" });
  }, [vscode]);

  useEffect(() => {
    if (!vscode) {
      return;
    }

    const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "configLoaded":
        case "configReset":
          applyConfig(message.config);
          setHasLoadedConfig(true);
          break;
        case "configSaved":
          if (message.success) {
            setNotification({ type: "success", message: "Settings saved successfully" });
          } else {
            setNotification({ type: "error", message: "Error saving settings" });
          }
          break;
        case "availableTools":
          setTools(message.tools);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "getConfig" });
    vscode.postMessage({ type: "getAvailableTools" });

    return () => window.removeEventListener("message", handleMessage);
  }, [vscode, applyConfig]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!hasLoadedConfig || tools.length === 0) {
      return;
    }

    if (areToolExecutionModesEqual(config.toolExecutionModes, effectiveToolExecutionModes)) {
      return;
    }

    saveOnBlur("toolExecutionModes", effectiveToolExecutionModes);
  }, [config.toolExecutionModes, effectiveToolExecutionModes, hasLoadedConfig, saveOnBlur, tools]);

  return (
    <div className="settingsView">
      <div className="settingsTabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          className={`settingsTab ${activeTab === "deepseek" ? "active" : ""}`}
          role="tab"
          aria-selected={activeTab === "deepseek"}
          onClick={() => setActiveTab("deepseek")}
        >
          DeepSeek
        </button>
        <button
          type="button"
          className={`settingsTab ${activeTab === "tools" ? "active" : ""}`}
          role="tab"
          aria-selected={activeTab === "tools"}
          onClick={() => setActiveTab("tools")}
        >
          Tools
        </button>
      </div>

      <div className="settingsTabPanel" role="tabpanel">
        {activeTab === "deepseek" ? (
          <ProvidersTab
            config={config}
            updateConfig={updateConfigSimple}
            saveOnBlur={saveOnBlurSimple}
            modelOptions={MODEL_OPTIONS}
            reasoningEffortOptions={REASONING_EFFORT_OPTIONS}
          />
        ) : (
          <ToolsTab
            config={{ ...config, toolExecutionModes: effectiveToolExecutionModes }}
            tools={tools}
            updateConfig={updateConfigSimple}
            saveOnBlur={saveOnBlurSimple}
          />
        )}
      </div>

      <button type="button" className="btn-secondary" onClick={handleReset}>
        Reset to Defaults
      </button>

      <div className={`notification ${notification ? notification.type : "hidden"}`} aria-live="polite">
        {notification?.message}
      </div>
    </div>
  );
}

export default SettingsView;

function normalizeToolExecutionModes(currentModes: ToolExecutionModes, tools: AvailableToolInfo[]): ToolExecutionModes {
  return Object.fromEntries(tools.map((tool) => [tool.name, currentModes[tool.name] ?? "enabled"]));
}

function areToolExecutionModesEqual(left: ToolExecutionModes, right: ToolExecutionModes): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && rightKeys.every((key) => left[key] === right[key]);
}
