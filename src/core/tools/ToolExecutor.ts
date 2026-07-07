// tools/ToolExecutor.ts — Ejecutor de tool calls
// ── FASE 4.4: Detecta `requiresConfirmation` de handlers peligrosos ──

import type { ToolCall } from "@/adapters";
import { ToolRegistry } from "./ToolRegistry";
import { FORCED_HANDLERS } from "./definitions";
import type { DangerLevel, ExecutionResult, ConfirmationRequiredResult } from "./types";

/**
 * Ejecutor de tool calls.
 * Recibe una tool call, la valida contra el registry y ejecuta el handler.
 * Si el handler retorna JSON con `requiresConfirmation`, lo detecta y lo propaga
 * como un resultado especial en lugar de ejecutar la acción real.
 */
export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  /**
   * Ejecutar una tool call.
   * - Valida que la herramienta exista
   * - Valida que los argumentos sean JSON válido
   * - Ejecuta el handler
   * - Si el handler retorna `requiresConfirmation`, lo propaga como resultado especial
   * - Retorna el resultado (éxito o error)
   */
  async execute(toolCall: ToolCall): Promise<ExecutionResult> {
    const validation = this.registry.validate(toolCall);

    if (!validation.valid) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: validation.error!,
        isError: true,
      };
    }

    try {
      const args = JSON.parse(toolCall.function.arguments);
      const registeredTool = this.registry.get(toolCall.function.name)!;
      const result = await registeredTool.handler(args);

      // ── Detectar si el handler pide confirmación adicional ──
      let parsedResult: unknown;
      try {
        parsedResult = JSON.parse(result);
      } catch {
        parsedResult = null;
      }

      if (isConfirmationRequiredResult(parsedResult)) {
        const confirmationResult: ConfirmationRequiredResult = {
          requiresConfirmation: true,
          dangerLevel: parsedResult.dangerLevel,
          warningMessage: parsedResult.warningMessage,
          command: parsedResult.command,
          filePath: parsedResult.filePath,
        };

        return {
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: JSON.stringify(confirmationResult),
          isError: false,
        };
      }

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result,
        isError: false,
      };
    } catch (err: unknown) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: `Error executing ${toolCall.function.name}: ${getErrorMessage(err)}`,
        isError: true,
      };
    }
  }

  /**
   * Ejecutar una tool call saltándose la confirmación de peligro.
   * Se usa cuando el usuario ya confirmó explícitamente.
   */
  async executeForced(toolCall: ToolCall): Promise<ExecutionResult> {
    const validation = this.registry.validate(toolCall);

    if (!validation.valid) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: validation.error!,
        isError: true,
      };
    }

    try {
      const args = JSON.parse(toolCall.function.arguments);
      const registeredTool = this.registry.get(toolCall.function.name)!;

      // Usar el handler forzado si existe (salta verificación de peligro)
      const handler = FORCED_HANDLERS[toolCall.function.name] || registeredTool.handler;
      const result = await handler(args);

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result,
        isError: false,
      };
    } catch (err: unknown) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        result: `Error executing ${toolCall.function.name}: ${getErrorMessage(err)}`,
        isError: true,
      };
    }
  }

  /** Ejecutar múltiples tool calls en paralelo (las del mismo turno) */
  async executeAll(toolCalls: ToolCall[]): Promise<ExecutionResult[]> {
    return Promise.all(toolCalls.map((tc) => this.execute(tc)));
  }

  /**
   * Verifica si un resultado de ejecución es una solicitud de confirmación.
   */
  static isConfirmationRequired(result: string): ConfirmationRequiredResult | null {
    try {
      const parsed: unknown = JSON.parse(result);
      if (isConfirmationRequiredResult(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
}

function isConfirmationRequiredResult(value: unknown): value is ConfirmationRequiredResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ConfirmationRequiredResult>;
  return result.requiresConfirmation === true && isDangerLevel(result.dangerLevel) && typeof result.warningMessage === "string";
}

function isDangerLevel(value: unknown): value is DangerLevel {
  return value === "safe" || value === "caution" || value === "dangerous" || value === "destructive";
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
