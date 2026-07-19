[Previous page: Overview](INDEX.md)

# Activation and Contributions

## Entry

`package.json` declares:

- `main`: `./dist/extension.js`.
- activity bar container: `yrs-dpsk-copilot-sidebar`.
- webview view: `yrs-dpsk-copilot.chatView`.
- commands: `yrs-dpsk-copilot.openChat`, `yrs-dpsk-copilot.addSelectionToChat`.

VS Code automatically generates activation events from those contributions. Do not keep a manual `activationEvents` list unless there is a specific reason.

## `activate(context.md)`

`src/Extension.ts` should:

- create `VsCodeToolWorkspace`.
- inject it into `core/tools`.
- create `WebviewProvider`.
- register `WebviewProvider.viewType`.
- register commands.
- add disposables to `context.subscriptions`.

## `deactivate()`

It should clear the tool workspace host to avoid references to VS Code APIs after the extension closes.

---

[Next page: Commands and Views](Commands-and-Views.md)
