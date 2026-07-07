import * as vscode from "vscode";
import type { WebviewToHandlerMessage } from "@/adapters";

export interface IMessageHandler<TMessage extends WebviewToHandlerMessage = WebviewToHandlerMessage> {
  handle(message: TMessage, webviewView: vscode.WebviewView): void;
}
