[Previous page: Overview](INDEX.md)

# State and Messaging

## Channel

The UI uses `src/ui/VsCodeApi.ts` and `postMessage`.

## Relevant hooks

- `useMessageHandler`: processes messages from the backend.
- `useStreamHandler`: accumulates chunks and reasoning, then renders text progressively so transport chunk boundaries are not exposed directly to the user.
- `useChatConfig`: loads and maintains configuration.
- `useToolCallController`: coordinates approvals and results.
- `FileSelector`: renders path autocomplete suggestions for `./` and `../`.

## Rules

- Do not access the filesystem directly from React.
- Do not store API keys in localStorage.
- Avoid duplicating contracts outside `src/adapters/messages/Webview.ts`.
- Backend errors should be shown without blocking the whole UI.
- Local state should be rebuildable from `configLoaded`, `history`, and `conversationLoaded`.
- Chat state remains mounted while switching between Chat, History, and Settings so pending generation and tool confirmations are not lost.
- Cancelled generation should restore the cancelled prompt to the input and remove the cancelled turn from visible chat state.

---

[Next page: UI Structure](UI-Structure.md)
