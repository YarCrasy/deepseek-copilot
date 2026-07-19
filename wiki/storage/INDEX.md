[Previous page: Registry and Executor](../tools/Registry-and-Executor.md)

# Storage

Persistence lives in `src/vscodeApi/storage`.

Goal:

- keep technical settings in `~/.yrs-dpsk-copilot/settings.json`.
- store the API key only in `SecretStorage`.
- store validated conversations as bounded JSON files.

The UI must not persist sensitive information on its own.

---

[Next page: Settings, Secrets, and History](Settings-Secrets-and-History.md)

## Pages

- [Settings Secrets and History](Settings-Secrets-and-History.md)
