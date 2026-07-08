import * as vscode from "vscode";
import { SIDEBAR_VIEW_ID } from "@/shared/constants";
import { registerChatCommands } from "@/vscode-api/commands/chatCommands";
import { WebviewProvider } from "@/vscode-api/webviews/WebviewProvider";

export function registerExtensionApi(context: vscode.ExtensionContext, provider: WebviewProvider): void {
  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, provider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("deepseek-copilot.openChat", () =>
      vscode.commands.executeCommand(SIDEBAR_VIEW_ID),
    ),
  );

  registerChatCommands(context, provider);
}
