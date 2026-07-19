[Previous page: Dependency Rules](Dependency-Rules.md)

# Layers

## `src/adapters`

Contains shared types and stable contracts:

- `deepseek/Chat.ts`: chat messages, request/response types, streaming chunks, and system prompt helpers.
- `Config.ts`: `AppConfig`, defaults, and DeepSeek-only configuration types.
- `messages/Webview.ts`: webview-handler contract.
- `deepseek/Models.ts`: DeepSeek models and reasoning options.

This layer must not depend on React, VS Code, or HTTP.

## `src/core`

Contains pure tool logic:

- tool registry.
- execution and validation.
- danger analysis.
- `ToolWorkspace` interface for workspace access without importing `vscode`.

Main rule: `core` must not import `vscode`.

## `src/deepseekApi`

Contains DeepSeek integration:

- DeepSeek provider.
- chat/FIM requests.
- SSE streaming.
- tool-call requests and parsing.
- API types and errors.

It should not contain UI logic or direct VS Code manipulation.

## `src/vscodeApi`

Contains concrete VS Code adapters:

- activation and commands.
- `WebviewProvider`.
- message handlers.
- settings and JSON-file conversation history.
- API key access through `SecretStorage`.
- filesystem/workspace/terminal implementation for tools.

## `src/ui`

Contains the React webview:

- Chat, History, and Settings views.
- messaging hooks.
- rendering for streaming, tool results, and confirmations.
- Vite build to `dist/webview`.

---

[Next page: Runtime Flow](Runtime-Flow.md)
