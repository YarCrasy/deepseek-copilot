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
        this.postCurrentConfig(webviewView);
        break;
      case "saveConfig":
        this._saveConfig(message.config, webviewView);
        break;
      case "resetConfig":
        this._resetConfig(webviewView);
        break;
      case "testConnection":
        this._testConnection(message, webviewView);
        break;
      default:
        logWarning("[SettingsHandler] Unknown message");
    }
  }

  async postCurrentConfig(webviewView: vscode.WebviewView): Promise<void> {
    const config = SettingsManager.load();
    const apiKey = await SecretsManager.getApiKey(this.context);

    webviewView.webview.postMessage({
      type: "configLoaded",
      config: { ...config, apiKey: apiKey || "" },
    });

    webviewView.webview.postMessage({
      type: "apiKeyStatusSettings",
      status: apiKey ? "configured" : "missing",
      keyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : undefined,
    });

    webviewView.webview.postMessage({
      type: "apiKeyStatus",
      status: apiKey ? "configured" : "missing",
      keyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : undefined,
    });
  }

  private async _saveConfig(config: Partial<AppConfig>, webviewView: vscode.WebviewView): Promise<void> {
    // apiKey is stored only in SecretStorage, never in synchronized settings.
    if (Object.prototype.hasOwnProperty.call(config, "apiKey")) {
      if (config.apiKey) {
        await SecretsManager.setApiKey(this.context, config.apiKey);
      } else {
        await SecretsManager.deleteApiKey(this.context);
      }
    }
    await SettingsManager.save(config);

    const freshConfig = SettingsManager.load();
    const apiKey = await SecretsManager.getApiKey(this.context);
    const apiKeyStatus = apiKey ? ("configured" as const) : ("missing" as const);

    webviewView.webview.postMessage({
      type: "configLoaded",
      config: { ...freshConfig, apiKey: apiKey || "" },
    });

    webviewView.webview.postMessage({
      type: "apiKeyStatus",
      status: apiKeyStatus,
      keyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : undefined,
    });

    webviewView.webview.postMessage({
      type: "configSaved",
      success: true,
    });
  }

  private async _resetConfig(webviewView: vscode.WebviewView): Promise<void> {
    await SettingsManager.reset();
    const config = SettingsManager.load();
    webviewView.webview.postMessage({
      type: "configReset",
      config,
    });
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
