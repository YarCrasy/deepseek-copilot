import * as vscode from "vscode";
import type { AppConfig, PermissionMode, ToolExecutionMode, ToolExecutionModes } from "@/adapters";
import { DEEPSEEK_DEFAULTS } from "@/deepseekApi";
import { CONFIG_SECTION } from "@/shared/constants";

type SyncedSettingKey = Exclude<keyof AppConfig, "apiKey" | "userId">;
const SYNCED_SETTING_KEYS = new Set<SyncedSettingKey>([
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
]);

export class SettingsManager {
  static load(): AppConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
      apiKey: "", // Stored in SecretsManager, not in settings.
      baseUrl: normalizeBaseUrl(config.get("baseUrl")),
      model: config.get("model") ?? DEEPSEEK_DEFAULTS.model,
      thinkingMode: config.get("thinkingMode") ?? DEEPSEEK_DEFAULTS.thinkingMode,
      reasoningEffort: config.get("reasoningEffort") ?? DEEPSEEK_DEFAULTS.reasoningEffort,
      temperature: clampNumber(config.get("temperature"), 0, 2, DEEPSEEK_DEFAULTS.temperature),
      topP: clampNumber(config.get("topP"), 0, 1, DEEPSEEK_DEFAULTS.topP),
      maxTokens: clampInteger(config.get("maxTokens"), 1, 65_536, DEEPSEEK_DEFAULTS.maxTokens),
      maxToolRounds: clampInteger(config.get("maxToolRounds"), 1, 20, DEEPSEEK_DEFAULTS.maxToolRounds),
      responseFormat: config.get("responseFormat") ?? DEEPSEEK_DEFAULTS.responseFormat,
      permissionMode: normalizePermissionMode(config.get("permissionMode")),
      toolExecutionModes: normalizeToolExecutionModes(config.get("toolExecutionModes")),
      autoContext: config.get("autoContext") ?? DEEPSEEK_DEFAULTS.autoContext,
      historyEnabled: config.get("historyEnabled") ?? DEEPSEEK_DEFAULTS.historyEnabled,
      historyRetentionDays: clampInteger(config.get("historyRetentionDays"), 0, 3650, DEEPSEEK_DEFAULTS.historyRetentionDays),
      enableBetaFeatures: config.get("enableBetaFeatures") ?? DEEPSEEK_DEFAULTS.enableBetaFeatures,
    };
  }

  static async save(partial: Partial<AppConfig>): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

    for (const [key, value] of Object.entries(partial)) {
      if (!isSyncedSettingKey(key) || value === undefined) {
        continue;
      }

      const nextValue = normalizeSettingValue(key, value);
      const target = key === "historyEnabled" || key === "historyRetentionDays" ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
      await config.update(key, nextValue, target);
    }
  }

  static async reset(): Promise<void> {
    await SettingsManager.save(DEEPSEEK_DEFAULTS);
  }
}

function isSyncedSettingKey(key: string): key is SyncedSettingKey {
  return SYNCED_SETTING_KEYS.has(key as SyncedSettingKey);
}

function normalizeSettingValue(key: SyncedSettingKey, value: unknown): unknown {
  if (key === "toolExecutionModes") {
    return normalizeToolExecutionModes(value);
  }
  if (key === "permissionMode") {
    return normalizePermissionMode(value);
  }
  if (key === "baseUrl") {return normalizeBaseUrl(value);}
  if (key === "temperature") {return clampNumber(value, 0, 2, DEEPSEEK_DEFAULTS.temperature);}
  if (key === "topP") {return clampNumber(value, 0, 1, DEEPSEEK_DEFAULTS.topP);}
  if (key === "maxTokens") {return clampInteger(value, 1, 65_536, DEEPSEEK_DEFAULTS.maxTokens);}
  if (key === "maxToolRounds") {return clampInteger(value, 1, 20, DEEPSEEK_DEFAULTS.maxToolRounds);}
  if (key === "historyRetentionDays") {return clampInteger(value, 0, 3650, DEEPSEEK_DEFAULTS.historyRetentionDays);}
  return value;
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== "string") {return DEEPSEEK_DEFAULTS.baseUrl;}
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {return DEEPSEEK_DEFAULTS.baseUrl;}
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch { return DEEPSEEK_DEFAULTS.baseUrl; }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function normalizePermissionMode(value: unknown): PermissionMode {
  return isPermissionMode(value) ? value : DEEPSEEK_DEFAULTS.permissionMode;
}

function isPermissionMode(value: unknown): value is PermissionMode {
  return value === "chat" || value === "read-only" || value === "workspace" || value === "full-access";
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
