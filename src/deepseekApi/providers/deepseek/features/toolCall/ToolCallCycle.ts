import { createSystemMessage, ensureSingleSystemPrompt } from "@/adapters/deepseek/Chat";
import { chatCompletion } from "../Chat";
import { createToolResultMessage, validateToolCall } from "./ToolCallMessages";
import { buildToolCallRequest } from "./ToolCallRequest";
import { streamToolCallRound } from "./ToolCallStreaming";
import type { RunToolCallCycleOptions, ToolCallCycleResult } from "./ToolCallTypes";

export async function runToolCallCycle(options: RunToolCallCycleOptions): Promise<ToolCallCycleResult> {
  const { initialMessages, tools, model, apiKey, baseUrl, executeToolCall, cycleOptions = {} } = options;

  const maxRounds = cycleOptions.maxRounds ?? 10;
  const availableTools = new Map(tools.map((tool) => [tool.function.name, tool]));
  const messages = ensureSingleSystemPrompt(initialMessages, createSystemMessage);
  let toolCallsExecuted = 0;

  for (let round = 0; round < maxRounds; round++) {
    if (cycleOptions.signal?.aborted) {
      throw createAbortError();
    }

    const shouldStream = cycleOptions.streamFinalResponse === true;
    const response = shouldStream
      ? await streamToolCallRound({ messages, tools, model, apiKey, baseUrl, cycleOptions, emitStreamEvents: true })
      : await chatCompletion(
          buildToolCallRequest({
            model,
            messages,
            tools,
            stream: false,
            cycleOptions,
          }),
          apiKey,
          baseUrl,
        );

    const message = response.choices[0].message;
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        finalMessage: message,
        rounds: round + 1,
        toolCallsExecuted,
        response,
      };
    }

    const executableToolCalls = message.tool_calls.filter((toolCall) => validateToolCall(toolCall, availableTools).valid);
    if (executableToolCalls.length > 0) {
      await cycleOptions.onRoundStart?.(round + 1, executableToolCalls);
    }
    messages.push(message);

    for (const toolCall of message.tool_calls) {
      if (cycleOptions.signal?.aborted) {
        throw createAbortError();
      }

      const validation = validateToolCall(toolCall, availableTools);
      if (!validation.valid) {
        messages.push(createToolResultMessage(toolCall.id, toolCall.function.name, `Error: ${validation.error}`));
        continue;
      }

      const result = await executeToolCall(toolCall);
      toolCallsExecuted++;
      cycleOptions.onToolResult?.(toolCall.id, result);
      messages.push(createToolResultMessage(toolCall.id, toolCall.function.name, result));
    }

    if (round === maxRounds - 1) {
      return {
        finalMessage: message,
        rounds: round + 1,
        toolCallsExecuted,
        response,
      };
    }
  }

  throw new Error(`Tool call cycle exceeded maximum rounds (${maxRounds})`);
}

function createAbortError(): Error {
  const error = new Error("Tool call cycle aborted");
  error.name = "AbortError";
  return error;
}
