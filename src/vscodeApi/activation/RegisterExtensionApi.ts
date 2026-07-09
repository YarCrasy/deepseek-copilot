import * as vscode from "vscode";
import { SIDEBAR_VIEW_ID } from "@/shared/constants";
import { registerChatCommands } from "@/vscodeApi/commands/ChatCommands";
import { WebviewProvider } from "@/vscodeApi/webviews/WebviewProvider";

export function registerExtensionApi(context: vscode.ExtensionContext, provider: WebviewProvider): void {
  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, provider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("yrs-dpsk-copilot.openChat", () =>
      vscode.commands.executeCommand(SIDEBAR_VIEW_ID),
    ),
  );

  registerChatCommands(context, provider);
}
