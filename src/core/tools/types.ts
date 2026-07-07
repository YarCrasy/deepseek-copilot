// tools/types.ts — Tipos locales del módulo tools

import type { ToolDefinition } from "@/adapters";

// ── Danger Levels ──

/** Nivel de peligrosidad de una herramienta */
export type DangerLevel = "safe" | "caution" | "dangerous" | "destructive";

/** Metadatos extendidos de una herramienta */
export interface ToolMetadata {
  dangerLevel: DangerLevel;
  warningMessage?: string;
  requiresConfirmation: boolean;
}

/** Una herramienta registrada: su definición (schema) + función ejecutora + metadatos */
export interface RegisteredTool {
  definition: ToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<string>;
  metadata: ToolMetadata;
}

/** Resultado de la validación de una tool call */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Resultado de la ejecución de una tool call (ya sea éxito o error) */
export interface ExecutionResult {
  toolCallId: string;
  toolName: string;
  result: string;
  isError: boolean;
}

/** Respuesta especial del handler que requiere confirmación adicional */
export interface ConfirmationRequiredResult {
  requiresConfirmation: true;
  dangerLevel: DangerLevel;
  warningMessage: string;
  command?: string;
  filePath?: string;
}
