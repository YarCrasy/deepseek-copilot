import { DEFAULT_CONFIG } from "@/adapters/config";
import { MODEL_REGISTRY, type DeepSeekModelInfo } from "@/adapters/models";

// ── Valores por defecto (alias a la fuente única en types/config.ts) ──
export const DEEPSEEK_DEFAULTS = DEFAULT_CONFIG;

// ── Modelos disponibles (alias a la fuente única en types/models.ts) ──
export const DEEPSEEK_MODELS: DeepSeekModelInfo[] = MODEL_REGISTRY;

// ── Validación: parámetros válidos según el modo ──
export interface ValidParams {
  canUseTemperature: boolean;
  canUseTopP: boolean;
  canUseStop: boolean;
  canUseResponseFormat: boolean;
  canUseTools: boolean;
  canUseLogprobs: boolean;
  canUseUserId: boolean;
}

export function getValidParamsForMode(thinkingMode: boolean): ValidParams {
  return {
    canUseTemperature: !thinkingMode,
    canUseTopP: !thinkingMode,
    canUseStop: true,
    canUseResponseFormat: true,
    canUseTools: true,
    canUseLogprobs: true,
    canUseUserId: true,
  };
}

// ── Validación de temperatura según use case ──
export interface TemperatureSuggestion {
  value: number;
  label: string;
  description: string;
}

export const TEMPERATURE_SUGGESTIONS: TemperatureSuggestion[] = [
  { value: 0.0, label: "0.0", description: "Código / Matemáticas" },
  { value: 1.0, label: "1.0", description: "Limpieza de datos / Análisis" },
  { value: 1.3, label: "1.3", description: "Conversación general / Traducción" },
  { value: 1.5, label: "1.5", description: "Escritura creativa / Poesía" },
];
