[Previous page: Scripts](Scripts.md)

# Verification

## Before closing code changes

Run:

```bash
npm run compile
npm run lint
npm run build
npm test
```

## Web documentation

Run in `web-doc`:

```bash
npm run build
```

## Manual validation

In Extension Development Host:

- open the DeepSeek Copilot sidebar.
- save API key.
- test connection.
- send a message with streaming.
- cancel generation.
- use history.
- type `./` or `../` in the chat input and select a suggested path.
- execute a safe tool.
- confirm or cancel a dangerous tool.
- open a file from preview.
- cancel generation and verify the prompt returns to the input and is not kept in history/context.

## API validation

Review [Official DeepSeek references](../deepseek-api/Official-References.md) when changing:

- models.
- chat parameters.
- streaming.
- thinking mode.
- JSON output.
- tool calls.
- FIM.
- HTTP errors.

## Technical documentation validation

- local Markdown links resolve.
- documented paths and message names match the current source tree.
- related documentation changes ship in the same commit as code changes.

---

[Next page: Overview](../maintenance/INDEX.md)
