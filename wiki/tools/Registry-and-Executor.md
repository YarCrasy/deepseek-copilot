[Previous page: Safety and Confirmations](Safety-and-Confirmations.md)

# Registry and Executor

## `ToolRegistry`

Keeps available definitions:

- id.
- description.
- argument schema.
- safety metadata.
- logical handler.

## `ToolExecutor`

Responsibilities:

- resolve tool by id.
- validate arguments.
- check execution mode.
- run handler.
- return structured result.

## `ToolWorkspace`

Interface that separates `core` from VS Code. It exposes capabilities such as:

- read file.
- write file.
- list directory.
- search text.
- execute commands.
- open file.

The current VS Code implementation is `VsCodeToolWorkspace`.

---

[Next page: Overview](../storage/INDEX.md)
