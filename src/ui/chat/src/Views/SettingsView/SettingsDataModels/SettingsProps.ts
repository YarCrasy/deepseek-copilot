import type { UpdateConfigFn, SaveOnBlurFn } from "./SettingsType";
import type { AppConfig, AvailableToolInfo } from "@/adapters";

export type ApiSectionProps = {
  config: Pick<AppConfig, "apiKey" | "model" | "baseUrl" | "thinkingMode" | "reasoningEffort">;
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
  modelOptions: Array<{ value: string; label: string }>;
  reasoningEffortOptions: Array<{ value: string; label: string }>;
};

export type AdvancedSectionProps = {
  config: Pick<AppConfig, "temperature" | "topP" | "maxTokens" | "baseUrl" | "responseFormat" | "streamResponse" | "thinkingMode">;
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
};

export type ToolsSectionProps = {
  config: Pick<AppConfig, "toolExecutionModes">;
  tools: AvailableToolInfo[];
  updateConfig: UpdateConfigFn;
  saveOnBlur: SaveOnBlurFn;
};
