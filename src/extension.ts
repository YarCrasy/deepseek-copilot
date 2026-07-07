import * as vscode from "vscode";
import { setToolWorkspaceHost } from "@/core/tools/toolWorkspace";
import { createVsCodeToolWorkspace } from "@/vscode-api/tools/VsCodeToolWorkspace";
import { WebviewProvider } from "@/vscode-api/webviews/WebviewProvider";

export function activate(context: vscode.ExtensionContext) {
  setToolWorkspaceHost(createVsCodeToolWorkspace());

  const provider = new WebviewProvider(context.extensionUri, context);

  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("deepseek-copilot.openChat", () =>
      vscode.commands.executeCommand("workbench.view.extension.deepseek-copilot-sidebar"),
    ),
  );
}

export function deactivate() {}
