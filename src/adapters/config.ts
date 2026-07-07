// ── Tipos compartidos de configuración ──
// Usados tanto por la extensión como por webview.

export type ToolExecutionMode = "disabled" | "enabled" | "auto_approve";
export type ToolExecutionModes = Record<string, ToolExecutionMode>;

export interface AppConfig {
  // Generales
  apiKey: string;
  baseUrl: string;

  // Modelo
  model: string;

  // Thinking Mode
  thinkingMode: boolean;
  reasoningEffort?: "high" | "max";

  // Sampling (solo aplican si thinkingMode=false)
  temperature: number;
  topP: number;

  // Output
  maxTokens: number;
  responseFormat: "text" | "json_object";

  // Streaming
  streamResponse: boolean;

  // Tool Calls (FASE 4)
  toolExecutionModes: ToolExecutionModes;

  // Opcionales
  userId?: string;
}

// ── Fuente ÚNICA de valores por defecto ──
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
  streamResponse: true,
  toolExecutionModes: {},
};
