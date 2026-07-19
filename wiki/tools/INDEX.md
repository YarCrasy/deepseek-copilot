[Previous page: UI Structure](../react-webview/UI-Structure.md)

# Tools

Tools let DeepSeek read context, search, create files, and execute commands according to configuration and confirmations.

Base logic lives in `src/core/tools`. Actions that require VS Code run through `ToolWorkspace`, implemented in `src/vscodeApi/tools/VsCodeToolWorkspace.ts`.

Principles:

- metadata and validation in `core`.
- real side effects in adapters.
- human confirmation for dangerous operations.
- structured results so the UI can render them well.

---

[Next page: Built-in Tools](Built-in-Tools.md)

## Pages

- [Built in Tools](Built-in-Tools.md)
- [Registry and Executor](Registry-and-Executor.md)
- [Safety and Confirmations](Safety-and-Confirmations.md)
