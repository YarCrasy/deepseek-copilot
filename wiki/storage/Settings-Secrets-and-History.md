[Previous page: Overview](INDEX.md)

# Settings, Secrets, and History

## `SettingsManager`

Reads, normalizes, and atomically writes `~/.yrs-dpsk-copilot/settings.json`.

It must handle:

- DeepSeek-only defaults.
- normalization of `toolExecutionModes`.
- ignoring old configuration that no longer applies.
- never persisting `apiKey`.

## `SecretsManager`

Stores the API key with `context.secrets`.

Current key:

- `yrs-dpsk-copilot.apiKey`

Rule: never write the API key to logs, history, settings, or visible messages.

## `HistoryManager`

Stores one validated JSON file per conversation under `~/.yrs-dpsk-copilot/history/`.

It should support:

- listing history.
- loading a conversation.
- deleting a conversation.
- persisting relevant messages after generation completes.

History should avoid storing temporary data that can be rebuilt from the UI.

---

[Next page: Overview](../build-and-test/INDEX.md)
