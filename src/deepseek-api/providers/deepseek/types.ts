export type { DeepSeekModelId, DeepSeekModelInfo, ReasoningEffort, ResponseFormatType } from "@/adapters/deepseek/models";

export type ThinkingModeType = "enabled" | "disabled";
export interface ThinkingConfig {
  type: ThinkingModeType;
}
export type StopSequences = string[];
