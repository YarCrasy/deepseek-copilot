// ── Re-exportar tipos compartidos desde la fuente única en types/ ──
export type { DeepSeekModelId, DeepSeekModelInfo, ReasoningEffort, ResponseFormatType } from "@/adapters/models";

// ── Tipos SOLO locales (NO duplicados, específicos de DeepSeek) ──
export type ThinkingModeType = "enabled" | "disabled";
export interface ThinkingConfig {
  type: ThinkingModeType;
}
export type StopSequences = string[];
