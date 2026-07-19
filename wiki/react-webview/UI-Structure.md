[Previous page: State and Messaging](State-and-Messaging.md)

# UI Structure

## Entry

- `src/ui/index.html`
- `src/ui/Main.tsx`
- `src/ui/App.tsx`

## Views

`ChatView`

- messages.
- input.
- path autocomplete through `FileSelector`.
- streaming.
- tool confirmations.

`HistoryView`

- conversation list.
- load and delete actions.

`SettingsView`

- API key.
- base URL.
- model.
- reasoning.
- generation parameters.
- tool modes.

## Shared components

- `Header`
- `Slider`
- `Toggle`
- `NumInput`
- global VS Code-like tooltips in `src/ui/App.css` through `data-tooltip`.
- base styles in `src/ui/styles`.

## Naming note

A `tabs/providers` folder may still exist from the migration. Its content must represent DeepSeek-only configuration, not a provider selector.

---

[Next page: Overview](../tools/INDEX.md)
