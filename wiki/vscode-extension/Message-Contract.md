[Previous page: Commands and Views](Commands-and-Views.md)

# Message Contract

The shared contract lives in `src/adapters/messages/Webview.ts`. The UI must not call backend internal APIs; it only sends messages through `postMessage`.

## Incoming from webview

- `sendMessage`: sends prompt, context, and referenced files.
- `cancelGeneration`: cancels the active streaming/request.
- `getConfig`: requests configuration and API key state.
- `saveConfig`: saves settings and API key.
- `resetConfig`: restores defaults.
- `testConnection`: validates DeepSeek connectivity.
- `getHistory`: lists saved conversations.
- `loadConversation`: loads a conversation by id.
- `deleteConversation`: deletes a conversation.
- `executeToolCall`: approves or executes a pending tool call.
- `getPathCompletions`: returns workspace path suggestions for chat input autocomplete.
- `getAvailableTools`: gets tool metadata.
- `openFile`: opens a file in VS Code.
- `newConversation`: clears the current chat state.

## Outgoing to webview

- `streamTimelineDelta`: incremental content or reasoning.
- `streamTimelineToolGroup`: chronological tool-call group.
- `streamDone`: successful generation end.
- `streamError`: UI-visible error.
- `configLoaded`: loaded configuration.
- `configSaved`: save confirmation.
- `history`: conversation list.
- `conversationLoaded`: recovered conversation.
- `toolCallStarted`: tool call started.
- `toolCallResult`: tool result.
- `toolCallConfirmationRequired`: requires human approval.
- `pathCompletions`: workspace path completion response.
- `availableTools`: available tool metadata.

## Compatibility

Historical naming such as `provider` may remain in internal names or messages, but product configuration must stay DeepSeek-only and must not expose an Ollama selector.

---

[Next page: Overview](../deepseek-api/INDEX.md)
