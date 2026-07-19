[Previous page: Conventions](Conventions.md)

# Migration Status

## Current state

- `deepseek-copilot-old` was removed.
- The extension compiles from `src`.
- The main output is `dist/extension.js`.
- The webview builds from `src/ui`.
- Public configuration is DeepSeek-only.
- Human documentation lives in `web-doc` with Astro and has English, Spanish, and Chinese routes.
- Technical documentation lives in the repository `wiki/` directory.
- Marketplace metadata, README, MIT license, and VSIX packaging are prepared for the current preview release.

## Watch list

- Legacy internal names such as `ProviderFactory`, `BaseProvider`, or `tabs/providers`.
- Historical messages such as `providers` if the UI stops needing them.
- Duplicated defaults between UI and backend.
- Ensure `core` remains free of `vscode` imports.
- Ensure new tools use `ToolWorkspace` and not direct VS Code APIs.
- Keep `web-doc/src/i18n.ts` as the source of translated documentation strings.

## Criteria for removing legacy compatibility

Remove a legacy piece when:

- it is not part of the active webview contract.
- it has no references in UI or handlers.
- it does not provide compatibility with existing conversations/history.
- compile and lint pass after removal.

---

[Next page: Beta Publishing](Beta-Publishing.md)
