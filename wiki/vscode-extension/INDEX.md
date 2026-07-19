[Previous page: Runtime Flow](../architecture/Runtime-Flow.md)

# VS Code Extension

The VS Code layer lives in `src/vscodeApi`, and the entry point is `src/Extension.ts`.

Responsibilities:

- register views and commands.
- render webviews.
- receive messages from React.
- connect handlers with settings, history, DeepSeek, and tools.
- adapt VS Code APIs so `core` does not depend on them.

The final bundle is generated at `dist/extension.js`.

---

[Next page: Activation and Contributions](Activation-and-Contributions.md)

## Pages

- [Activation and Contributions](Activation-and-Contributions.md)
- [Commands and Views](Commands-and-Views.md)
- [Message Contract](Message-Contract.md)
