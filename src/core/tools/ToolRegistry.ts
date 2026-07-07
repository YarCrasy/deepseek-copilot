// tools/ToolRegistry.ts — Catálogo central de herramientas

import type { ToolDefinition } from "@/adapters";
import { logWarning } from "@/shared/logging/logger";
import type { RegisteredTool, ValidationResult } from "./types";

/**
 * Catálogo central de herramientas.
 * - Registra nombre → definición + handler
 * - Genera el array 'tools' para enviar a la API
 * - Valida que una tool call exista antes de ejecutar
 */
export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  /** Registrar una herramienta */
  register(tool: RegisteredTool): void {
    const name = tool.definition.function.name;
    if (this.tools.has(name)) {
      logWarning(`[ToolRegistry] Tool '${name}' already registered. Overwriting.`);
    }
    this.tools.set(name, tool);
  }

  /** Obtener una herramienta registrada */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /** Verificar si una herramienta existe */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Obtener todas las definiciones para enviar a la API de DeepSeek */
  getDefinitionsForAPI(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /** Validar una tool call contra el registro */
  validate(toolCall: { function: { name: string; arguments: string } }): ValidationResult {
    const toolDef = this.tools.get(toolCall.function.name);
    if (!toolDef) {
      return { valid: false, error: `Unknown tool: ${toolCall.function.name}` };
    }

    try {
      JSON.parse(toolCall.function.arguments);
      return { valid: true };
    } catch {
      return { valid: false, error: `Invalid JSON arguments for ${toolCall.function.name}` };
    }
  }

  /** Número de herramientas registradas */
  get size(): number {
    return this.tools.size;
  }
}
