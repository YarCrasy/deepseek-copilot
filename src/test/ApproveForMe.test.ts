import * as assert from "assert";
import type * as vscode from "vscode";
import { PERMISSION_MODE_ALLOWED_TOOLS, type ToolCall } from "@/adapters";
import type { ToolExecutor } from "@/core/tools/ToolExecutor";
import { executeToolCall } from "@/vscodeApi/webviews/handlers/chat/toolCalls/ToolExecution";
import type { StoredExecution, ToolExecutionContext } from "@/vscodeApi/webviews/handlers/chat/toolCalls/Types";

suite("auto approve permission mode", () => {
  test("is a global permission mode with access to every non-disabled tool", () => {
    assert.strictEqual(PERMISSION_MODE_ALLOWED_TOOLS["auto-approve"], null);
  });

  test("executes the model tool call directly without heuristic or user confirmation", async () => {
    const messages: unknown[] = [];
    const executions = new Map<string, StoredExecution>();
    let normalExecutions = 0;
    let forcedExecutions = 0;
    let confirmationRequests = 0;
    const toolCall: ToolCall = {
      id: "call-1",
      type: "function",
      function: { name: "run_terminal_command", arguments: JSON.stringify({ command: "custom-build-tool --run" }) },
    };
    const toolExecutor = {
      execute: async () => {
        normalExecutions += 1;
        throw new Error("heuristic path should not run");
      },
      executeForced: async () => {
        forcedExecutions += 1;
        return { toolCallId: toolCall.id, toolName: toolCall.function.name, result: "completed", isError: false };
      },
    } as unknown as ToolExecutor;
    const context: ToolExecutionContext = {
      toolExecutor,
      webviewView: { webview: { postMessage: (message: unknown) => {messages.push(message); return Promise.resolve(true);} } } as unknown as vscode.WebviewView,
      executedToolCalls: executions,
      autoApproveMode: true,
      getToolMode: () => "enabled",
      getCurrentRound: () => 1,
      getPendingCycle: () => null,
      requestDangerConfirmation: async () => {
        confirmationRequests += 1;
        return { confirmed: false };
      },
      isDangerTrusted: () => false,
      trustDangerForSession: () => undefined,
    };

    const result = await executeToolCall(toolCall, context);

    assert.strictEqual(result, "completed");
    assert.strictEqual(normalExecutions, 0);
    assert.strictEqual(forcedExecutions, 1);
    assert.strictEqual(confirmationRequests, 0);
    assert.strictEqual(executions.get(toolCall.id)?.status, "completed");
    assert.strictEqual(messages.some((message) => (message as { type?: string }).type === "toolCallConfirmationRequired"), false);
  });
});
