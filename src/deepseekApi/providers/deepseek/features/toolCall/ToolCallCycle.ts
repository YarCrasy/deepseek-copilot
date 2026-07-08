import { createSystemMessage, ensureSingleSystemPrompt } from "@/adapters/deepseek/Chat";
import { chatCompletion } from "../Chat";
import { createToolResultMessage, hasToolResultMessages, validateToolCall } from "./ToolCallMessages";
import { buildToolCallRequest } from "./ToolCallRequest";
import { streamToolCallRound } from "./ToolCallStreaming";
import type { RunToolCallCycleOptions, ToolCallCycleResult } from "./ToolCallTypes";

export async function runToolCallCycle(options: RunToolCallCycleOptions): Promise<ToolCallCycleResult> {
  const { initialMessages, tools, model, apiKey, baseUrl, executeToolCall, cycleOptions = {} } = options;

  const maxRounds = cycleOptions.maxRounds ?? 10;
  const availableTools = new Map(tools.map((tool) => [tool.function.name, tool]));
  const messages = ensureSingleSystemPrompt(initialMessages, createSystemMessage);
  let toolCallsExecuted = 0;
  let forceFinalResponse = false;

  for (let round = 0; round < maxRounds; round++) {
    if (cycleOptions.signal?.aborted) {
      throw new Error("Tool call cycle aborted");
    }

    const isFinalResponseAfterTools = hasToolResultMessages(messages);
    const roundTools = forceFinalResponse ? [] : tools;
    const shouldStream = cycleOptions.streamFinalResponse === true && (cycleOptions.streamToolCallRounds === true || isFinalResponseAfterTools);
    const response = shouldStream
      ? await streamToolCallRound({ messages, tools: roundTools, model, apiKey, baseUrl, cycleOptions, emitStreamEvents: isFinalResponseAfterTools })
      : await chatCompletion(
          buildToolCallRequest({
            model,
            messages,
            tools: roundTools,
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
      if (isSuccessfulWriteToolResult(toolCall.function.name, result)) {
        forceFinalResponse = true;
      }
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

function isSuccessfulWriteToolResult(toolName: string, result: string): boolean {
  if (!isWriteTool(toolName)) {
    return false;
  }
  try {
    const parsed: unknown = JSON.parse(result);
    if (!parsed || typeof parsed !== "object") {
      return false;
    }
    const type = (parsed as { type?: unknown }).type;
    return type === "fileWrite" || type === "fileEdit" || type === "filePatch";
  } catch {
    return false;
  }
}

function isWriteTool(toolName: string): boolean {
  return toolName === "create_file" || toolName === "edit_file" || toolName === "apply_patch";
}
