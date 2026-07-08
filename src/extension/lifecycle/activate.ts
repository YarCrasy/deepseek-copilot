import * as vscode from "vscode";
import { setToolWorkspaceHost } from "@/core/tools/toolWorkspace";
import { registerExtensionApi } from "@/vscode-api/activation/registerExtensionApi";
import { createVsCodeToolWorkspace } from "@/vscode-api/tools/VsCodeToolWorkspace";
import { WebviewProvider } from "@/vscode-api/webviews/WebviewProvider";

export function activate(context: vscode.ExtensionContext) {
  setToolWorkspaceHost(createVsCodeToolWorkspace());

  const provider = new WebviewProvider(context.extensionUri, context);
  registerExtensionApi(context, provider);
}
