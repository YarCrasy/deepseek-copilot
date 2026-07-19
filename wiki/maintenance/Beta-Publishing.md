[Previous page: Migration Status](Migration-Status.md)

# Beta Publishing

## Target release

Use the version declared in `package.json`.

## Marketplace metadata

- Publisher: `YCraSyStudio`
- Repository: `https://github.com/YarCrasy/deepseek-copilot`
- License: MIT
- Categories: `AI`, `Chat`
- Main entry: `dist/extension.js`
- Activity bar icon: `src/assets/DeepSeekIcon.svg`

## Required checks

Run from the repository root:

```bash
npm run compile
npm run lint
npm run build
npm test
```

Run the human documentation build:

```bash
cd web-doc
npm run build
```

The Astro build output is the repository root `docs/` folder. Configure GitHub Pages to serve from the main branch `/docs` folder.

Package the VSIX:

```bash
npx @vscode/vsce package --no-dependencies
```

Do not use the deprecated `vsce` package. Older versions still require explicit `activationEvents`; modern VS Code generates activation events from contribution declarations.

## Manual beta validation

- Open Extension Development Host.
- Open DeepSeek Copilot from the Activity Bar.
- Save and test a DeepSeek API key.
- Send a normal chat message.
- Send a prompt that needs a file and select a path through `./` autocomplete.
- Verify tool call confirmation, execution, and result rendering.
- Switch between Chat, History, and Settings while a tool call is pending.
- Cancel generation and verify the prompt returns to the input.
- Verify the cancelled prompt is not kept in conversation history or the next request context.
- Open a file from a tool result.
- Verify Settings tooltips and select controls render correctly.

## Known beta constraints

- DeepSeek is the only AI provider.
- Tool execution is workspace-sensitive and should be reviewed before auto approval.
- The webview tooltip system mimics VS Code theme variables but cannot invoke native VS Code hover widgets directly.
- Explorer clipboard URI access is not used; workspace references are entered through path autocomplete.
