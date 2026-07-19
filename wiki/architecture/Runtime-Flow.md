[Previous page: Layers](Layers.md)

# Runtime Flow

## Activation

1. VS Code activates the extension from the contributions declared in `package.json`.
2. `src/Extension.ts` creates the VS Code tool host.
3. It registers `WebviewProvider.viewType = "yrs-dpsk-copilot.chatView"`.
4. It registers the extension commands and chat view.

## Opening the chat

1. VS Code resolves the `yrs-dpsk-copilot.chatView` view.
2. `WebviewProvider` loads HTML from `dist/webview`.
3. The React UI starts with `vscodeApi`.
4. The UI requests configuration, history, and available tools.

## User message

1. The UI sends `sendMessage`.
2. `WebviewProvider` delegates to `ChatHandler`.
3. `ChatHandler` loads settings and API key.
4. A direct DeepSeek provider is created.
5. Conversation context is built.
6. Streaming response execution starts.
7. The backend sends timeline deltas, tool groups, `streamDone`, or `streamError`.
8. `HistoryManager` persists the conversation.

## Tool calls

1. DeepSeek emits tool calls.
2. `ToolCallSession` evaluates metadata and execution mode.
3. If the tool is dangerous, it sends `toolCallConfirmationRequired`.
4. The UI asks for human confirmation.
5. `ToolExecutor` runs using the injected `ToolWorkspace`.
6. The result goes back to DeepSeek or is shown in the UI depending on the cycle.

## Referenced files

1. The user selects files through path autocomplete or an Explorer/editor command.
2. The extension resolves workspace-relative paths and bounded previews.
3. The chat sends the validated references as explicit context.

---

[Next page: Overview](../vscode-extension/INDEX.md)
