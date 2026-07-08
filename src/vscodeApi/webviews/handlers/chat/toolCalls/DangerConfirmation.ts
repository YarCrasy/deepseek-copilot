import type * as vscode from "vscode";
import type { ToolCall } from "@/adapters";
import type { ConfirmationRequiredResult } from "@/core/tools/Types";
import type { DangerConfirmationDecision, PendingDangerConfirmation } from "./Types";

interface DangerConfirmationOptions {
  webviewView: vscode.WebviewView;
  toolCall: ToolCall;
  confirmationResult: ConfirmationRequiredResult;
  setPendingDangerConfirmation: (value: PendingDangerConfirmation | null) => void;
  announceStarted?: boolean;
  round?: number;
}

export async function requestDangerConfirmation(options: DangerConfirmationOptions): Promise<DangerConfirmationDecision> {
  const { webviewView, toolCall, confirmationResult, setPendingDangerConfirmation, announceStarted = false, round = 0 } = options;

  const decision = await new Promise<DangerConfirmationDecision>((resolve) => {
    setPendingDangerConfirmation({ toolCall, resolve, confirmationResult });

    if (announceStarted) {
      webviewView.webview.postMessage({
        type: "toolCallStarted",
        toolCalls: [toolCall],
        round,
      });
    }

    webviewView.webview.postMessage({
      type: "toolCallConfirmationRequired",
      toolCalls: [toolCall],
      round,
      autoExecute: false,
      dangerConfirmation: {
        ...confirmationResult,
        canTrustForSession: confirmationResult.dangerLevel !== "destructive",
      },
    });
  });

  setPendingDangerConfirmation(null);
  return decision;
}
