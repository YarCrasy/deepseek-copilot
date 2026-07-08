import * as vscode from "vscode";
import { setToolWorkspaceHost } from "@/core/tools/ToolWorkspace";
import { registerExtensionApi } from "@/vscodeApi/activation/RegisterExtensionApi";
import { createVsCodeToolWorkspace } from "@/vscodeApi/tools/VsCodeToolWorkspace";
import { WebviewProvider } from "@/vscodeApi/webviews/WebviewProvider";

export function activate(context: vscode.ExtensionContext) {
  setToolWorkspaceHost(createVsCodeToolWorkspace());

  const provider = new WebviewProvider(context.extensionUri, context);
  registerExtensionApi(context, provider);
}
