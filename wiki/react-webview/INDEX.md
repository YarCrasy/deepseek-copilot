[Previous page: Tool Calls](../deepseek-api/Tool-Calls.md)

# React Webview

The chat UI lives in `src/ui` and is built with Vite.

Responsibilities:

- render Chat, History, and Settings.
- send messages to the backend through `vscodeApi`.
- show streaming and reasoning.
- show tool calls, results, and confirmations.
- manage referenced files and previews.

The UI should remain decoupled from Node and internal VS Code APIs.

---

[Next page: State and Messaging](State-and-Messaging.md)

## Pages

- [State and Messaging](State-and-Messaging.md)
- [UI Structure](UI-Structure.md)
