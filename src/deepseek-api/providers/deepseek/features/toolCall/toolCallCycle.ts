import { createSystemMessage, ensureSingleSystemPrompt } from "@/adapters/chat";
import { chatCompletion } from "../chat";
import { createToolResultMessage, hasToolResultMessages, validateToolCall } from "./toolCallMessages";
import { buildToolCallRequest } from "./toolCallRequest";
import { streamToolCallRound } from "./toolCallStreaming";
import type { RunToolCallCycleOptions, ToolCallCycleResult } from "./toolCallTypes";

export async function runToolCallCycle(options: RunToolCallCycleOptions): Promise<ToolCallCycleResult> {
  const { initialMessages, tools, model, apiKey, baseUrl, executeToolCall, cycleOptions = {} } = options;

  const maxRounds = cycleOptions.maxRounds ?? 10;
  const availableTools = new Map(tools.map((tool) => [tool.function.name, tool]));
  const messages = ensureSingleSystemPrompt(initialMessages, createSystemMessage);
  let toolCallsExecuted = 0;

  for (let round = 0; round < maxRounds; round++) {
    if (cycleOptions.signal?.aborted) {
      throw new Error("Tool call cycle aborted");
    }

    const isFinalResponseAfterTools = hasToolResultMessages(messages);
    const shouldStream = cycleOptions.streamFinalResponse === true && (cycleOptions.streamToolCallRounds === true || isFinalResponseAfterTools);
    const response = shouldStream
      ? await streamToolCallRound({ messages, tools, model, apiKey, baseUrl, cycleOptions, emitStreamEvents: isFinalResponseAfterTools })
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

    await cycleOptions.onRoundStart?.(round + 1, message.tool_calls);
    messages.push(message);

    for (const toolCall of message.tool_calls) {
      if (cycleOptions.signal?.aborted) {
        break;
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
