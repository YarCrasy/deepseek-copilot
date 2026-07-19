[Previous page: Home](../INDEX.md)

# Architecture

The extension is organized in layers to isolate VS Code, DeepSeek, UI, and domain logic.

Main layers:

- `src/adapters`: shared contracts between the extension backend and the webview.
- `src/core`: pure logic, tools, and safety rules without `vscode` imports.
- `src/deepseekApi`: DeepSeek HTTP client, streaming, FIM, and tool-call protocol.
- `src/vscodeApi`: activation, commands, persistence, webviews, and concrete VS Code adapters.
- `src/ui`: React app that runs inside the webview.

Architecture goal: keep maintainable logic outside VS Code where possible, and make external API boundaries explicit.

---

[Next page: Dependency Rules](Dependency-Rules.md)

## Pages

- [Dependency Rules](Dependency-Rules.md)
- [Layers](Layers.md)
- [Runtime Flow](Runtime-Flow.md)
