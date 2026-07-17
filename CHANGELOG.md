# Change Log

## [0.1.1] - 2026-07-17

- Replaced text markers with a native chronological timeline for reasoning, content, and tool groups.
- Unified tool states and fixed rejection, cancellation, host acknowledgement, duplicate calls, stale pending calls, and maximum-round termination.
- Added structured non-interactive terminal results, bounded output, process-tree cancellation, and platform-aware danger analysis.
- Hardened DeepSeek SSE parsing, response validation, URL handling, timeouts, and bounded retries.
- Added multi-root conversation association, bounded context, staged Git context, binary detection, delimited references, `AGENTS.md` limits, and optimistic file hashes.
- Moved settings and per-conversation history to `~/.yrs-dpsk-copilot/` with atomic writes, validation, retention, quotas, corruption isolation, pagination, bulk deletion, and Undo.
- Completed the accessible chat, confirmation, settings, and history flows; added English, Spanish, and Chinese webview localization.
- Fixed history deletion and new-chat state synchronization, including clearing Chat view when the active conversation is removed.
- Updated the extension and documentation icons to the purple and green preview palette.
- Fixed the Windows integration-test runner and verified activation against VS Code 1.129.0.

## [0.1.0] - 2026-07-12

- Initial preview release for the VS Code Marketplace.
