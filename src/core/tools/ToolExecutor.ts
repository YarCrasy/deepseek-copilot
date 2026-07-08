import type { ToolCall } from "@/adapters";
import { ToolRegistry } from "./ToolRegistry";
import { FORCED_HANDLERS } from "./definitions";
import type { DangerLevel, ExecutionResult, ConfirmationRequiredResult } from "./Types";

/**
 * Executes tool calls and propagates handler-level confirmation requests.
 */
export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  /**
   * Validate and execute a tool call.
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
   * Execute a tool call after explicit user confirmation.
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

  /** Execute multiple tool calls from the same turn in parallel. */
  async executeAll(toolCalls: ToolCall[]): Promise<ExecutionResult[]> {
    return Promise.all(toolCalls.map((tc) => this.execute(tc)));
  }

  /**
   * Check whether an execution result requests confirmation.
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
