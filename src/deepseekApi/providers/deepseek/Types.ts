export type { DeepSeekModelId, DeepSeekModelInfo, ReasoningEffort, ResponseFormatType } from "@/adapters/deepseek/Models";

export type ThinkingModeType = "enabled" | "disabled";
export interface ThinkingConfig {
  type: ThinkingModeType;
}
export type StopSequences = string[];
