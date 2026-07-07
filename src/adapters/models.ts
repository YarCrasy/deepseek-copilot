// ── Registro único de modelos y tipos DeepSeek ──
// ADR-001: Los tipos compartidos viven en types/

export type DeepSeekModelId = "deepseek-v4-flash" | "deepseek-v4-pro";
export type ReasoningEffort = "high" | "max";
export type ResponseFormatType = "text" | "json_object";

export interface DeepSeekModelInfo {
  id: DeepSeekModelId;
  name: string;
  contextLength: number;
  maxOutputTokens: number;
  supportsThinking: boolean;
  supportsFIM: boolean;
  supportsTools: boolean;
}

// Fuente ÚNICA de modelos
export const MODEL_REGISTRY: DeepSeekModelInfo[] = [
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    contextLength: 1_000_000,
    maxOutputTokens: 393_216,
    supportsThinking: true,
    supportsFIM: false,
    supportsTools: true,
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    contextLength: 1_000_000,
    maxOutputTokens: 393_216,
    supportsThinking: true,
    supportsFIM: true,
    supportsTools: true,
  },
] as const;

// Derivado para UI (value + label plano)
export type ModelOption = { value: DeepSeekModelId; label: string };
export const MODEL_OPTIONS: ModelOption[] = MODEL_REGISTRY.map((m) => ({
  value: m.id,
  label: m.name,
}));
