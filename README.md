# Yar's DeepSeek Copilot

Yar's DeepSeek Copilot is a VS Code assistant focused entirely on DeepSeek. It adds a sidebar chat with streaming responses, reasoning output, conversation history, path autocomplete for workspace context, and controlled tool execution for workspace tasks.

> Preview disclaimer: Yar's DeepSeek Copilot is an independent third-party extension. It is not affiliated with, endorsed by, sponsored by, or officially maintained by DeepSeek. Preview releases may contain bugs; review tool calls and keep important work under version control.

The extension is DeepSeek-only by design. There is no provider selector and no Ollama integration.

## Features

- Sidebar chat inside VS Code.
- Streaming responses from DeepSeek.
- Optional thinking mode and reasoning display.
- Conversation history with load and delete actions.
- Type `./` or `../` in the chat input to autocomplete workspace paths.
- Built-in tools for reading files, listing directories, searching content, creating files, and running terminal commands.
- Safety confirmations for dangerous or destructive tool calls.
- Stop generation restores the cancelled prompt to the input and does not keep it in conversation context.
- API key stored in VS Code Secret Storage.

## Requirements

- VS Code `1.125.0` or newer.
- A DeepSeek API key.
- Network access to the configured DeepSeek API base URL.

Get an API key from DeepSeek:

https://platform.deepseek.com/api_keys

## Getting Started

1. Install and open Yar's DeepSeek Copilot.
2. Open the Yar's DeepSeek Copilot activity bar item.
3. Go to Settings inside the chat view.
4. Paste your DeepSeek API key.
5. Choose model and generation settings.
6. Send a message from the Chat view.

## Commands

- `Yar's DeepSeek Copilot: Open Chat`
- `Yar's DeepSeek Copilot: New Chat`
- `Yar's DeepSeek Copilot: Add File to Chat`
- `Yar's DeepSeek Copilot: Add Folder to Chat`
- `Yar's DeepSeek Copilot: Add Selection to Chat`
- `Yar's DeepSeek Copilot: Review Changes`

## Extension Settings

This extension contributes the following settings:

- `yrs-dpsk-copilot.model`: DeepSeek model ID to use.
- `yrs-dpsk-copilot.thinkingMode`: Enable DeepSeek thinking mode.
- `yrs-dpsk-copilot.reasoningEffort`: Reasoning effort level, `high` or `max`.
- `yrs-dpsk-copilot.temperature`: Sampling temperature.
- `yrs-dpsk-copilot.topP`: Top P sampling.
- `yrs-dpsk-copilot.maxTokens`: Maximum tokens for responses.
- `yrs-dpsk-copilot.responseFormat`: Response format, `text` or `json_object`.
- `yrs-dpsk-copilot.streamResponse`: Enable streaming responses.
- `yrs-dpsk-copilot.permissionMode`: Global tool permission mode, from chat-only to full access.
- `yrs-dpsk-copilot.autoContext`: Automatically include active-editor and Git context.
- `yrs-dpsk-copilot.toolExecutionModes`: Per-tool execution modes.
- `yrs-dpsk-copilot.baseUrl`: DeepSeek API base URL.
- `yrs-dpsk-copilot.projectInstructions.includeHomeAgents`: Allow reading `~/.yrs-dpsk-copilot/AGENTS.md`.

The API key is not stored in VS Code settings. It is stored with VS Code Secret Storage.

## Tools and Safety

Yar's DeepSeek Copilot can execute workspace tools when enabled. Tool access is controlled first by permission mode:

- `chat`: no tools.
- `read-only`: read, list, and search workspace files.
- `workspace`: read-only tools plus workspace file creation.
- `full-access`: all tools. Dangerous commands still require confirmation.

Tool execution is then controlled per tool:

- `disabled`: never execute the tool.
- `enabled`: execute with normal safety checks.
- `auto_approve`: execute without confirmation only when the operation is not considered dangerous.

Dangerous operations, such as overwriting files or running risky terminal commands, require confirmation before execution.

## Documentation

- Human documentation: `web-doc` with English, Spanish, and Chinese routes.
- Technical documentation: https://github.com/YarCrasy/deepseek-copilot/wiki
- DeepSeek API reference: https://api-docs.deepseek.com/

## Development

```bash
npm install
npm run compile
npm run lint
npm run build
npm test
```

Useful scripts:

- `npm run build:extension`: build the VS Code extension bundle.
- `npm run build:webview`: build the React webview.
- `npm run dev:webview`: start the webview dev server.

## Known Limitations

- DeepSeek is the only supported AI provider.
- Tool execution depends on workspace permissions and user confirmation.
- FIM support follows DeepSeek beta API behavior and may require the beta base URL.
- This is a beta release. Review tool permissions before using it on important workspaces.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).
