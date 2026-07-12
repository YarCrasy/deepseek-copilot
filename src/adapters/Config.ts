export type ToolExecutionMode = "disabled" | "enabled" | "auto_approve";
export type ToolExecutionModes = Record<string, ToolExecutionMode>;
export type PermissionMode = "chat" | "read-only" | "workspace" | "full-access";
export type PermissionModeAllowedTools = readonly string[] | null;

export const PERMISSION_MODE_ALLOWED_TOOLS: Record<PermissionMode, PermissionModeAllowedTools> = {
  chat: [],
  "read-only": ["read_file", "list_directory", "search_content"],
  workspace: ["read_file", "list_directory", "search_content", "create_file", "edit_file", "apply_patch"],
  "full-access": null,
};

export interface AppConfig {
  apiKey: string;
  baseUrl: string;

  model: string;

  thinkingMode: boolean;
  reasoningEffort?: "high" | "max";

  temperature: number;
  topP: number;

  maxTokens: number;
  responseFormat: "text" | "json_object";

  permissionMode: PermissionMode;
  toolExecutionModes: ToolExecutionModes;

  autoContext: boolean;
  enableBetaFeatures: boolean;

  userId?: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  thinkingMode: true,
  reasoningEffort: "high",
  temperature: 1.0,
  topP: 1.0,
  maxTokens: 8192,
  responseFormat: "text",
  permissionMode: "read-only",
  toolExecutionModes: {},
  autoContext: false,
  enableBetaFeatures: false,
};
