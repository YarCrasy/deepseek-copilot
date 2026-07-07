import * as vscode from "vscode";
import type { AppConfig, ToolExecutionMode, ToolExecutionModes } from "@/adapters";
import { DEEPSEEK_DEFAULTS } from "@/deepseek-api";

const CONFIG_SECTION = "deepseek-copilot";
type SyncedSettingKey = Exclude<keyof AppConfig, "apiKey" | "userId">;
const SYNCED_SETTING_KEYS = new Set<SyncedSettingKey>([
  "baseUrl",
  "model",
  "thinkingMode",
  "reasoningEffort",
  "temperature",
  "topP",
  "maxTokens",
  "responseFormat",
  "streamResponse",
  "toolExecutionModes",
]);

export class SettingsManager {
  static load(): AppConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
      apiKey: "", // No se guarda en settings, va en SecretsManager
      baseUrl: config.get("baseUrl") ?? DEEPSEEK_DEFAULTS.baseUrl,
      model: config.get("model") ?? DEEPSEEK_DEFAULTS.model,
      thinkingMode: config.get("thinkingMode") ?? DEEPSEEK_DEFAULTS.thinkingMode,
      reasoningEffort: config.get("reasoningEffort") ?? DEEPSEEK_DEFAULTS.reasoningEffort,
      temperature: config.get("temperature") ?? DEEPSEEK_DEFAULTS.temperature,
      topP: config.get("topP") ?? DEEPSEEK_DEFAULTS.topP,
      maxTokens: config.get("maxTokens") ?? DEEPSEEK_DEFAULTS.maxTokens,
      responseFormat: config.get("responseFormat") ?? DEEPSEEK_DEFAULTS.responseFormat,
      streamResponse: config.get("streamResponse") ?? DEEPSEEK_DEFAULTS.streamResponse,
      toolExecutionModes: normalizeToolExecutionModes(config.get("toolExecutionModes")),
    };
  }

  static async save(partial: Partial<AppConfig>): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

    for (const [key, value] of Object.entries(partial)) {
      if (!isSyncedSettingKey(key) || value === undefined) {
        continue;
      }

      const nextValue = key === "toolExecutionModes" ? normalizeToolExecutionModes(value) : value;
      await config.update(key, nextValue, vscode.ConfigurationTarget.Global);
    }
  }

  static async reset(): Promise<void> {
    await SettingsManager.save(DEEPSEEK_DEFAULTS);
  }
}

function isSyncedSettingKey(key: string): key is SyncedSettingKey {
  return SYNCED_SETTING_KEYS.has(key as SyncedSettingKey);
}

function normalizeToolExecutionModes(value: unknown): ToolExecutionModes {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEEPSEEK_DEFAULTS.toolExecutionModes;
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, ToolExecutionMode] => isToolExecutionMode(entry[1])),
  );
}

function isToolExecutionMode(value: unknown): value is ToolExecutionMode {
  return value === "disabled" || value === "enabled" || value === "auto_approve";
}
