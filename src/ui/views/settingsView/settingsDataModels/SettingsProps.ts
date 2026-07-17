import type { UpdateConfigFn, SaveOnBlurFn } from "./SettingsType";
import type { AppConfig, AvailableToolInfo } from "@/adapters";

export type ApiSectionProps = {
  config: Pick<AppConfig, "apiKey" | "model" | "baseUrl" | "thinkingMode" | "reasoningEffort">;
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
  modelOptions: Array<{ value: string; label: string }>;
  reasoningEffortOptions: ReadonlyArray<{ value: NonNullable<AppConfig["reasoningEffort"]>; label: string }>;
};

export type AdvancedSectionProps = {
  config: Pick<AppConfig, "temperature" | "topP" | "maxTokens" | "maxToolRounds" | "baseUrl" | "responseFormat" | "thinkingMode" | "enableBetaFeatures" | "historyEnabled" | "historyRetentionDays" | "includeHomeAgents">;
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
};

export type ToolsSectionProps = {
  config: Pick<AppConfig, "permissionMode" | "toolExecutionModes">;
  tools: AvailableToolInfo[];
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
};
