import * as vscode from "vscode";
import { SettingsManager, SecretsManager } from "@/vscodeApi/storage";
import { logWarning } from "@/shared/logging/Logger";
import type { AppConfig, WebviewToHandlerMessage } from "@/adapters";
import { deepseekFetch } from "@/deepseekApi/client/DeepSeekFetch";

type SettingsMessage = Extract<WebviewToHandlerMessage, { type: "getConfig" | "saveConfig" | "resetConfig" | "testConnection" }>;
type TestConnectionMessage = Extract<WebviewToHandlerMessage, { type: "testConnection" }>;

export class SettingsHandler {
  constructor(private context: vscode.ExtensionContext) {}

  handle(message: SettingsMessage, webviewView: vscode.WebviewView): void {
    switch (message.type) {
      case "getConfig":
        void this.postCurrentConfig(webviewView);
        break;
      case "saveConfig":
        void this._saveConfig(message.config, webviewView);
        break;
      case "resetConfig":
        void this._resetConfig(webviewView);
        break;
      case "testConnection":
        void this._testConnection(message, webviewView);
        break;
      default:
        logWarning("[SettingsHandler] Unknown message");
    }
  }

  async postCurrentConfig(webviewView: vscode.WebviewView): Promise<void> {
    try {
      await this._postConfigAndApiKeyStatus(webviewView, "configLoaded");
    } catch (error: unknown) {
      logWarning(`[SettingsHandler] Failed to load settings: ${getErrorMessage(error)}`);
      await webviewView.webview.postMessage({ type: "configSaved", success: false });
    }
  }

  private async _saveConfig(config: Partial<AppConfig>, webviewView: vscode.WebviewView): Promise<void> {
    try {
      // apiKey is stored only in SecretStorage, never in synchronized settings.
      if (Object.prototype.hasOwnProperty.call(config, "apiKey")) {
        if (config.apiKey) {
          await SecretsManager.setApiKey(this.context, config.apiKey);
        } else {
          await SecretsManager.deleteApiKey(this.context);
        }
      }
      await SettingsManager.save(config);
      await this._postConfigAndApiKeyStatus(webviewView, "configLoaded");
      await webviewView.webview.postMessage({ type: "configSaved", success: true });
    } catch (error: unknown) {
      logWarning(`[SettingsHandler] Failed to save settings: ${getErrorMessage(error)}`);
      await webviewView.webview.postMessage({ type: "configSaved", success: false });
    }
  }

  private async _resetConfig(webviewView: vscode.WebviewView): Promise<void> {
    const confirmation = await vscode.window.showWarningMessage(
      "Reset all extension settings to their defaults?",
      { modal: true, detail: "Your API key is stored separately and will be preserved." },
      "Reset settings",
    );
    if (confirmation !== "Reset settings") {return;}

    try {
      await SettingsManager.reset();
      await this._postConfigAndApiKeyStatus(webviewView, "configReset");
    } catch (error: unknown) {
      logWarning(`[SettingsHandler] Failed to reset settings: ${getErrorMessage(error)}`);
      await webviewView.webview.postMessage({ type: "configSaved", success: false });
    }
  }

  private async _postConfigAndApiKeyStatus(webviewView: vscode.WebviewView, type: "configLoaded" | "configReset"): Promise<void> {
    const config = SettingsManager.load();
    const apiKey = (await SecretsManager.getApiKey(this.context)) || "";
    const status = apiKey ? "configured" : "missing";
    const keyPreview = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : undefined;

    await webviewView.webview.postMessage({ type, config: { ...config, apiKey } });
    await webviewView.webview.postMessage({ type: "apiKeyStatusSettings", status, keyPreview });
    await webviewView.webview.postMessage({ type: "apiKeyStatus", status, keyPreview });
  }

  private async _testConnection(payload: TestConnectionMessage, webviewView: vscode.WebviewView): Promise<void> {
    const { apiKey, baseUrl, model } = payload;
    try {
      await deepseekFetch({
        pathOrUrl: "chat/completions",
        apiKey,
        baseUrl,
        requestInit: {
          method: "POST",
          body: JSON.stringify({ model: model || "deepseek-v4-flash", messages: [{ role: "user", content: "Hello" }], max_tokens: 2 }),
        },
      });

      webviewView.webview.postMessage({
        type: "connectionTestResult",
        success: true,
      });
    } catch (err: unknown) {
      webviewView.webview.postMessage({
        type: "connectionTestResult",
        success: false,
        error: getErrorMessage(err),
      });
    }
  }

}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
