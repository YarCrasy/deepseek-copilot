import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import { getVsCodeApi } from "@webview/VsCodeApi";
import type { ApiKeyStatus, ApiSectionProps } from "..";

type ApiSectionMessage =
  | { type: "apiKeyStatusSettings"; status: "configured" | "missing"; keyPreview?: string }
  | { type: "connectionTestResult"; success: boolean; error?: string };

type ApiConnectionStateOptions = Pick<ApiSectionProps, "config" | "updateConfig" | "saveOnBlur">;

export function useApiConnectionState({ config, updateConfig, saveOnBlur }: ApiConnectionStateOptions) {
  const vscode = useMemo(() => getVsCodeApi(), []);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusOverride, setStatusOverride] = useState<"configured" | "missing" | null>(null);
  const [statusPreviewOverride, setStatusPreviewOverride] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<"success" | "failed" | null>(null);

  const apiKeyStatus = useMemo<ApiKeyStatus>(() => {
    if (isTesting) {return "testing";}
    if (!config.apiKey) {return "missing";}
    if (statusOverride) {return statusOverride;}
    if (lastTestResult === "failed") {return "missing";}
    return "configured";
  }, [config.apiKey, isTesting, lastTestResult, statusOverride]);

  const apiKeyPreview = useMemo(() => {
    if (isTesting) {return "Testing...";}
    if (!config.apiKey) {return "Not configured";}
    if (statusPreviewOverride) {return statusPreviewOverride;}
    if (lastTestResult === "success") {return "Connection OK";}
    if (lastTestResult === "failed") {return "Connection failed";}
    return "Configured";
  }, [config.apiKey, isTesting, lastTestResult, statusPreviewOverride]);

  const resetTransientStatus = useCallback(() => {
    setIsTesting(false);
    setStatusOverride(null);
    setStatusPreviewOverride(null);
    setLastTestResult(null);
  }, []);

  const handleTestConnection = useCallback(() => {
    if (!vscode) {
      return;
    }

    setIsTesting(true);
    setStatusOverride(null);
    setStatusPreviewOverride(null);
    setLastTestResult(null);
    vscode.postMessage({
      type: "testConnection",
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    });
  }, [config.apiKey, config.baseUrl, config.model, vscode]);

  const handleApiKeyChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      resetTransientStatus();
      updateConfig("apiKey", event.target.value);
    },
    [resetTransientStatus, updateConfig],
  );

  const handleApiKeyBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      saveOnBlur("apiKey", event.target.value);
    },
    [saveOnBlur],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ApiSectionMessage>) => {
      const message = event.data;
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }

      if (message.type === "apiKeyStatusSettings") {
        setIsTesting(false);
        setLastTestResult(null);
        setStatusOverride(message.status);
        setStatusPreviewOverride(message.status === "configured" ? (message.keyPreview ?? "Configured") : "Not configured");
      }

      if (message.type === "connectionTestResult") {
        setIsTesting(false);
        setLastTestResult(message.success ? "success" : "failed");
        setStatusOverride(null);
        setStatusPreviewOverride(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return {
    apiKeyPreview,
    apiKeyStatus,
    apiKeyStatusClass: apiKeyStatus === "configured" ? "statusConfigured" : apiKeyStatus === "testing" ? "statusTesting" : "statusMissing",
    handleApiKeyBlur,
    handleApiKeyChange,
    handleTestConnection,
    isTesting,
    showApiKey,
    toggleShowApiKey: () => setShowApiKey((current) => !current),
  };
}
