import * as vscode from "vscode";
import type { AppConfig } from "@/adapters";
import { setToolWorkspaceHost } from "@/core/tools/ToolWorkspace";
import { CONFIG_SECTION, INCLUDE_HOME_AGENTS_KEY } from "@/shared/constants";
import { registerExtensionApi } from "@/vscodeApi/activation/RegisterExtensionApi";
import { SettingsManager } from "@/vscodeApi/storage";
import { createVsCodeToolWorkspace } from "@/vscodeApi/tools/VsCodeToolWorkspace";
import { WebviewProvider } from "@/vscodeApi/webviews/WebviewProvider";

const LEGACY_SETTING_KEYS: ReadonlyArray<Exclude<keyof AppConfig, "apiKey" | "userId" | "includeHomeAgents">> = [
  "baseUrl",
  "model",
  "thinkingMode",
  "reasoningEffort",
  "temperature",
  "topP",
  "maxTokens",
  "maxToolRounds",
  "responseFormat",
  "permissionMode",
  "toolExecutionModes",
  "autoContext",
  "historyEnabled",
  "historyRetentionDays",
  "enableBetaFeatures",
];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await initializeUserSettings();
  setToolWorkspaceHost(createVsCodeToolWorkspace());

  const provider = new WebviewProvider(context.extensionUri, context);
  registerExtensionApi(context, provider);
}

async function initializeUserSettings(): Promise<void> {
  const legacyConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const initialSettings = Object.fromEntries(LEGACY_SETTING_KEYS.map((key) => [key, legacyConfig.get(key)]));
  initialSettings.includeHomeAgents = legacyConfig.get(INCLUDE_HOME_AGENTS_KEY);
  await SettingsManager.initialize(initialSettings);

  const removals: Thenable<void>[] = [];
  for (const key of [...LEGACY_SETTING_KEYS, INCLUDE_HOME_AGENTS_KEY]) {
    const inspected = legacyConfig.inspect(key);
    if (inspected?.globalValue !== undefined) {
      removals.push(legacyConfig.update(key, undefined, vscode.ConfigurationTarget.Global));
    }
    if (inspected?.workspaceValue !== undefined || inspected?.workspaceFolderValue !== undefined) {
      removals.push(legacyConfig.update(key, undefined, vscode.ConfigurationTarget.Workspace));
    }
  }
  await Promise.all(removals);
}
